import Keycloak from 'keycloak-js'
import type KeycloakType from 'keycloak-js'
import type { KeycloakProfile } from 'keycloak-js'
import { readKeycloakEnv } from './env'
import { StateStore } from './StateStore'
import type { AuthState } from './types'

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

export class KeycloakAuthService {
  private readonly kc: KeycloakType
  private readonly store = new StateStore<AuthState>({ status: 'loading' })

  private initPromise: Promise<AuthState> | null = null
  private refreshTimer: number | null = null
  private readonly enabled: boolean

  constructor() {
    const env = readKeycloakEnv()
    this.enabled = env.enabled

    if (!this.enabled) {
      // If auth is disabled, immediately expose an unauthenticated state.
      this.kc = ({} as unknown) as KeycloakType
      this.store.set({ status: 'unauthenticated' })
      return
    }

    this.kc = new Keycloak({
      url: env.url,
      realm: env.realm,
      clientId: env.clientId,
    })
  }

  get keycloak(): KeycloakType {
    return this.kc
  }

  getState(): AuthState {
    return this.store.get()
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    return this.store.subscribe(listener)
  }

  private syncTokenToState() {
    const prev = this.store.get()
    this.store.set({
      ...prev,
      token: this.kc.token,
      tokenParsed: this.kc.tokenParsed,
    })
  }

  private async syncProfileToState() {
    if (!this.kc.authenticated) {
      const prev = this.store.get()
      this.store.set({
        ...prev,
        profile: undefined,
      })
      return
    }
    const profile: KeycloakProfile = await this.kc.loadUserProfile()
    const prev = this.store.get()
    this.store.set({
      ...prev,
      profile,
    })
  }

  init(): Promise<AuthState> {
    if (!this.enabled) {
      // When disabled, we never touch Keycloak; state is already unauthenticated.
      return Promise.resolve(this.store.get())
    }
    if (!this.initPromise) {
      this.initPromise = this.doInit()
    }
    return this.initPromise
  }

  private async doInit(): Promise<AuthState> {
    try {
      const env = readKeycloakEnv()

      const authenticated = await this.kc.init({
        onLoad: env.onLoad,
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })

      this.kc.onAuthSuccess = () => {
        const prev = this.store.get()
        this.store.set({ ...prev, status: 'authenticated', error: undefined })
        this.syncTokenToState()
        void this.syncProfileToState()
      }

      this.kc.onAuthLogout = () => {
        this.store.set({
          status: 'unauthenticated',
          error: undefined,
          profile: undefined,
          token: undefined,
          tokenParsed: undefined,
        })
      }

      this.kc.onTokenExpired = () => {
        void this.refreshToken(30)
      }

      this.store.set({
        status: authenticated ? 'authenticated' : 'unauthenticated',
        error: undefined,
        profile: undefined,
        token: this.kc.token,
        tokenParsed: this.kc.tokenParsed,
      })

      if (authenticated) {
        await this.syncProfileToState()
      }

      this.startTokenRefreshLoop()
      return this.store.get()
    } catch (e) {
      this.store.set({ status: 'error', error: toErrorMessage(e) })
      return this.store.get()
    }
  }

  private startTokenRefreshLoop() {
    if (this.refreshTimer != null || !this.enabled) return
    this.refreshTimer = window.setInterval(() => {
      if (!this.kc.authenticated) return
      void this.refreshToken(30)
    }, 15_000)
  }

  dispose() {
    if (this.refreshTimer != null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (!this.enabled) return
    this.kc.onAuthSuccess = undefined
    this.kc.onAuthLogout = undefined
    this.kc.onTokenExpired = undefined
  }

  async login(): Promise<void> {
    if (!this.enabled) return
    await this.kc.login()
  }

  async logout(): Promise<void> {
    if (!this.enabled) return
    await this.kc.logout({ redirectUri: window.location.origin })
  }

  async refreshToken(minValiditySeconds = 30): Promise<boolean> {
    if (!this.enabled) return false
    const refreshed = await this.kc.updateToken(minValiditySeconds)
    this.syncTokenToState()
    return refreshed
  }
}


