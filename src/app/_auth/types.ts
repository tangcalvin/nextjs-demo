import type { User, UserProfile } from 'oidc-client-ts'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export type AuthState = {
  status: AuthStatus
  error?: string
  profile?: UserProfile
  token?: string
  tokenParsed?: Record<string, unknown>
  user?: User
}
