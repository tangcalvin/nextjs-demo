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
  private readonly refreshIntervalSeconds: number
  private readonly proactiveRefreshThresholdSeconds: number

  constructor() {
    const env = readOidcEnv()
    this.enabled = env.enabled
    this.refreshIntervalSeconds = env.refreshIntervalSeconds
    this.proactiveRefreshThresholdSeconds = env.proactiveRefreshThresholdSeconds

    if (!this.enabled) {
      this.store.set({ status: 'unauthenticated' })
      return
    }

    // Only initialize UserManager in the browser (not during SSR)
    if (typeof window === 'undefined') {
      this.store.set({ status: 'loading' })
      return
    }

    // Initialize UserManager with OIDC configuration
    this.userManager = new UserManager({
      authority: env.authority,
      client_id: env.clientId,
      redirect_uri: env.redirectUri,
      post_logout_redirect_uri: env.postLogoutRedirectUri,
      response_type: 'code',
      // Include 'offline_access' scope to get refresh tokens that persist across sessions
      scope: 'openid profile email offline_access',
      automaticSilentRenew: true,
      includeIdTokenInSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      // PKCE is enabled by default in oidc-client-ts for authorization code flow
      // Explicitly set code_challenge_method to S256 (recommended)
      extraQueryParams: {},
      filterProtocolClaims: true,
      loadUserInfo: true,
      // Ensure PKCE is used (default, but explicit for clarity)
      // oidc-client-ts automatically generates code_verifier and code_challenge
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

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    if (error && typeof error === 'object') {
      // Check for ErrorResponse or other error object structures from oidc-client-ts
      const errObj = error as Record<string, unknown>
      return String(
        errObj.message ||
          errObj.error ||
          errObj.error_description ||
          errObj.errorMessage ||
          JSON.stringify(error)
      )
    }
    return String(error)
  }

  private isSessionError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase()
    return (
      lowerMessage.includes('session not active') ||
      lowerMessage.includes('session_not_active') ||
      lowerMessage.includes('invalid_grant') ||
      lowerMessage.includes('refresh token expired') ||
      lowerMessage.includes('token expired') ||
      lowerMessage.includes('session expired')
    )
  }

  private async clearUserState(): Promise<void> {
    try {
      if (this.userManager) {
        await this.userManager.removeUser()
      }
    } catch (removeError) {
      console.warn('Error removing user:', removeError)
      // Continue anyway - clear state manually
    }

    this.store.set({
      status: 'unauthenticated',
      error: undefined,
      profile: undefined,
      token: undefined,
      tokenParsed: undefined,
      user: undefined,
    })
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
    // Wait for browser environment if we're still in SSR
    if (typeof window === 'undefined') {
      this.store.set({ status: 'loading' })
      return this.store.get()
    }

    // Initialize UserManager if not already done (happens when constructor ran during SSR)
    if (!this.userManager && this.enabled) {
      const env = readOidcEnv()
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
        console.log('Access token expiring, attempting refresh...')
        void this.refreshToken(30)
      })

      this.userManager.events.addSilentRenewError((error) => {
        console.error('Silent renew error:', error)
        // Try to refresh manually
        void this.refreshToken(30).catch((refreshError) => {
          console.error('Manual refresh after silent renew error failed:', refreshError)
          // If refresh fails, user may need to re-authenticate
          this.store.set({
            status: 'error',
            error: 'Session expired. Please sign in again.',
          })
        })
      })
    }

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
        if (!user) return

        // Proactively refresh if token expires within the configured threshold
        const expiresIn = user.expires_at ? user.expires_at - Math.floor(Date.now() / 1000) : 0
        if (expiresIn > 0 && expiresIn < this.proactiveRefreshThresholdSeconds) {
          console.log(`Token expires in ${expiresIn}s, refreshing proactively (threshold: ${this.proactiveRefreshThresholdSeconds}s)...`)
          const refreshed = await this.refreshToken(this.proactiveRefreshThresholdSeconds)
          if (!refreshed) {
            console.warn('Proactive token refresh failed')
          }
        } else if (user.expired) {
          console.log('Token expired, attempting refresh...')
          const refreshed = await this.refreshToken(30)
          if (!refreshed) {
            console.warn('Token refresh failed after expiration')
            // refreshToken already handles session errors and updates state appropriately
            // Only set error if we're still in an authenticated state (non-session errors)
            const currentState = this.store.get()
            if (currentState.status === 'authenticated') {
              this.store.set({
                status: 'error',
                error: 'Session expired. Please sign in again.',
              })
            }
          }
        }
      } catch (error) {
        console.error('Error in token refresh loop:', error)
      }
    }, this.refreshIntervalSeconds * 1000)
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
    if (!this.enabled || !this.userManager) {
      console.warn('Cannot refresh token: auth disabled or UserManager not available')
      return false
    }

    try {
      const user = await this.userManager.getUser()
      if (!user) {
        console.warn('Cannot refresh token: no user found')
        return false
      }

      // Check if token expires within minValiditySeconds
      const expiresIn = user.expires_at ? user.expires_at - Math.floor(Date.now() / 1000) : 0
      if (expiresIn > minValiditySeconds) {
        // Token still valid, no refresh needed
        return false
      }

      console.log(`Refreshing token (expires in ${expiresIn}s, need ${minValiditySeconds}s validity)`)
      
      // Perform silent renew
      let renewedUser
      try {
        renewedUser = await this.userManager.signinSilent()
      } catch (silentError) {
        // signinSilent can throw errors - handle them here before the outer catch
        console.error('signinSilent failed:', silentError)
        
        // Check if it's a session error
        const errorMessage = this.extractErrorMessage(silentError)
        if (this.isSessionError(errorMessage)) {
          console.warn('Session expired during signinSilent, clearing user state')
          await this.clearUserState()
          return false
        }
        // Re-throw if it's not a session error so outer catch can handle it
        throw silentError
      }
      
      if (renewedUser) {
        console.log('Token refreshed successfully')
        this.syncUserToState(renewedUser)
        return true
      }

      console.warn('Token refresh returned no user')
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      
      // Check if it's a "Session not active" error (refresh token expired/invalid)
      const errorMessage = this.extractErrorMessage(error)
      
      if (this.isSessionError(errorMessage)) {
        console.warn('Session expired or refresh token invalid, clearing user state for re-authentication')
        await this.clearUserState()
        return false
      }
      
      // For other errors, update state to indicate error but don't clear auth state
      // (might be a temporary network issue)
      this.store.set({
        status: 'error',
        error: errorMessage || 'Failed to refresh session',
      })
      return false
    }
  }

  get userManagerInstance(): UserManager | null {
    return this.userManager
  }
}

