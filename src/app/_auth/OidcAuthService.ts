import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { readOidcEnv } from './env'
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

/**
 * OIDC authentication service using oidc-client-ts.
 * Handles initialization, login, logout, token refresh, and state management.
 */
export class OidcAuthService {
  private userManager: UserManager | null = null
  private readonly store = new StateStore<AuthState>({ status: 'loading' })
  private initPromise: Promise<AuthState> | null = null
  private refreshTimer: number | null = null
  private readonly enabled: boolean

  constructor() {
    const env = readOidcEnv()
    this.enabled = env.enabled

    if (!this.enabled) {
      this.store.set({ status: 'unauthenticated' })
      return
    }

    // Initialize UserManager with OIDC configuration
    this.userManager = new UserManager({
      authority: env.authority,
      client_id: env.clientId,
      redirect_uri: env.redirectUri,
      post_logout_redirect_uri: env.postLogoutRedirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      automaticSilentRenew: true,
      includeIdTokenInSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      // PKCE configuration
      extraQueryParams: {},
      filterProtocolClaims: true,
      loadUserInfo: true,
    })

    // Set up event handlers
    this.userManager.events.addUserLoaded((user) => {
      this.syncUserToState(user)
    })

    this.userManager.events.addUserUnloaded(() => {
      this.store.set({
        status: 'unauthenticated',
        error: undefined,
        profile: undefined,
        token: undefined,
        tokenParsed: undefined,
        user: undefined,
      })
    })

    this.userManager.events.addAccessTokenExpiring(() => {
      void this.refreshToken(30)
    })

    this.userManager.events.addSilentRenewError((error) => {
      console.error('Silent renew error:', error)
      // Try to refresh manually
      void this.refreshToken(30)
    })
  }

  getState(): AuthState {
    return this.store.get()
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    return this.store.subscribe(listener)
  }

  private syncUserToState(user: User | null) {
    if (!user) {
      this.store.set({
        status: 'unauthenticated',
        error: undefined,
        profile: undefined,
        token: undefined,
        tokenParsed: undefined,
        user: undefined,
      })
      return
    }

    // Parse token if available
    let tokenParsed: Record<string, unknown> | undefined
    if (user.id_token) {
      try {
        const parts = user.id_token.split('.')
        if (parts.length === 3) {
          const payload = parts[1]
          tokenParsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        }
      } catch {
        // Ignore parse errors
      }
    }

    this.store.set({
      status: 'authenticated',
      error: undefined,
      profile: user.profile,
      token: user.access_token,
      tokenParsed,
      user,
    })
  }

  init(): Promise<AuthState> {
    if (!this.enabled) {
      return Promise.resolve(this.store.get())
    }

    if (!this.initPromise) {
      this.initPromise = this.doInit()
    }
    return this.initPromise
  }

  private async doInit(): Promise<AuthState> {
    if (!this.userManager) {
      this.store.set({ status: 'error', error: 'UserManager not initialized' })
      return this.store.get()
    }

    try {
      const env = readOidcEnv()

      // Check if we're returning from a redirect by looking for OAuth callback params
      const urlParams = new URLSearchParams(window.location.search)
      const hasCallbackParams = urlParams.has('code') || urlParams.has('error')

      if (hasCallbackParams) {
        // We're on a redirect callback - process it
        try {
          const user = await this.userManager.signinRedirectCallback()
          if (user) {
            this.syncUserToState(user)
            this.startTokenRefreshLoop()
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
            return this.store.get()
          }
        } catch (e) {
          // Callback processing failed
          this.store.set({ status: 'error', error: toErrorMessage(e) })
          return this.store.get()
        }
      }

      // Try to get existing user from storage
      const user = await this.userManager.getUser()

      if (user && !user.expired) {
        // User exists and token is valid
        this.syncUserToState(user)
        this.startTokenRefreshLoop()
        return this.store.get()
      }

      if (user && user.expired) {
        // Token expired, try silent renew
        try {
          const renewedUser = await this.userManager.signinSilent()
          if (renewedUser) {
            this.syncUserToState(renewedUser)
            this.startTokenRefreshLoop()
            return this.store.get()
          }
        } catch {
          // Silent renew failed, user needs to login again
        }
      }

      // No valid user found
      if (env.onLoad === 'login-required') {
        // Redirect to login
        await this.login()
        return this.store.get()
      }

      // check-sso: just set unauthenticated state
      this.store.set({ status: 'unauthenticated' })
      return this.store.get()
    } catch (e) {
      this.store.set({ status: 'error', error: toErrorMessage(e) })
      return this.store.get()
    }
  }

  private startTokenRefreshLoop() {
    if (this.refreshTimer != null || !this.enabled || !this.userManager) return

    this.refreshTimer = window.setInterval(async () => {
      if (!this.userManager) return

      try {
        const user = await this.userManager.getUser()
        if (user && user.expired) {
          await this.refreshToken(30)
        }
      } catch {
        // Ignore errors in refresh loop
      }
    }, 15_000)
  }

  dispose() {
    if (this.refreshTimer != null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async login(): Promise<void> {
    if (!this.enabled || !this.userManager) return
    await this.userManager.signinRedirect()
  }

  async logout(): Promise<void> {
    if (!this.enabled || !this.userManager) return
    await this.userManager.signoutRedirect()
  }

  async refreshToken(minValiditySeconds = 30): Promise<boolean> {
    if (!this.enabled || !this.userManager) return false

    try {
      const user = await this.userManager.getUser()
      if (!user) return false

      // Check if token expires within minValiditySeconds
      const expiresIn = user.expires_at ? user.expires_at - Math.floor(Date.now() / 1000) : 0
      if (expiresIn > minValiditySeconds) {
        // Token still valid, no refresh needed
        return false
      }

      // Perform silent renew
      const renewedUser = await this.userManager.signinSilent()
      if (renewedUser) {
        this.syncUserToState(renewedUser)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  get userManagerInstance(): UserManager | null {
    return this.userManager
  }
}

