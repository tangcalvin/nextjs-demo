type OnLoadMode = 'login-required' | 'check-sso'

function required(name: string, value: string | undefined): string {
  if (value && value.trim().length > 0) return value
  throw new Error(
    `Missing required env var: ${name}. Set ${name} in your environment (e.g. .env.local) before starting the dev server.`,
  )
}

function getOnLoad(): OnLoadMode {
  const raw = process.env.NEXT_PUBLIC_KEYCLOAK_ONLOAD?.trim()
  if (raw === 'login-required' || raw === 'check-sso') return raw
  return 'check-sso'
}

export type OidcEnv = {
  enabled: boolean
  authority: string
  clientId: string
  redirectUri: string
  postLogoutRedirectUri: string
  onLoad: OnLoadMode
}

export function readOidcEnv(): OidcEnv {
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

  if (!enabled) {
    return {
      enabled,
      authority: '',
      clientId: '',
      redirectUri: '',
      postLogoutRedirectUri: '',
      onLoad: 'check-sso',
    }
  }

  const url = required('NEXT_PUBLIC_KEYCLOAK_URL', process.env.NEXT_PUBLIC_KEYCLOAK_URL)
  const realm = required('NEXT_PUBLIC_KEYCLOAK_REALM', process.env.NEXT_PUBLIC_KEYCLOAK_REALM)
  const clientId = required(
    'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  )

  // Build OIDC authority URL (Keycloak realm endpoint)
  const authority = `${url}/realms/${realm}`
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : ''
  const postLogoutRedirectUri = redirectUri

  return {
    enabled,
    authority,
    clientId,
    redirectUri,
    postLogoutRedirectUri,
    onLoad: getOnLoad(),
  }
}
