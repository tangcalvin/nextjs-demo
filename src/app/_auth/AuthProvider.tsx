'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authService } from './authService'
import type { AuthState, AuthStatus } from './types'
import { readOidcEnv } from './env'

export type AuthContextValue = {
  status: AuthStatus
  error?: string
  profile?: AuthState['profile']
  token?: AuthState['token']
  tokenParsed?: AuthState['tokenParsed']
  enabled: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshToken: (minValiditySeconds?: number) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider />')
  }
  return ctx
}

export function AuthProvider({ children }: PropsWithChildren) {
  const env = readOidcEnv()
  const [state, setState] = useState<AuthState>(() => authService.getState())

  useEffect(() => {
    if (!env.enabled) {
      // When disabled, keep simple unauthenticated state and skip OIDC init entirely.
      setState({ status: 'unauthenticated' })
      return
    }
    const unsubscribe = authService.subscribe(setState)
    void authService.init()
    return unsubscribe
  }, [env.enabled])

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      error: state.error,
      profile: state.profile,
      token: state.token,
      tokenParsed: state.tokenParsed,
      enabled: env.enabled,
      login: () => authService.login(),
      logout: () => authService.logout(),
      refreshToken: (minValiditySeconds = 30) =>
        authService.refreshToken(minValiditySeconds),
    }),
    [env.enabled, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


