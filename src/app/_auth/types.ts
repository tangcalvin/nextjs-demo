import type { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export type AuthState = {
  status: AuthStatus
  error?: string
  profile?: KeycloakProfile
  token?: string
  tokenParsed?: KeycloakTokenParsed
}


