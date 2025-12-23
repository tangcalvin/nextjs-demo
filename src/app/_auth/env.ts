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

export type KeycloakEnv = {
  enabled: boolean
  url: string
  realm: string
  clientId: string
  onLoad: OnLoadMode
}

export function readKeycloakEnv(): KeycloakEnv {
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

  if (!enabled) {
    // When auth is disabled, values are placeholders and never used.
    return {
      enabled,
      url: '',
      realm: '',
      clientId: '',
      onLoad: 'check-sso',
    }
  }

  return {
    enabled,
    url: required('NEXT_PUBLIC_KEYCLOAK_URL', process.env.NEXT_PUBLIC_KEYCLOAK_URL),
    realm: required('NEXT_PUBLIC_KEYCLOAK_REALM', process.env.NEXT_PUBLIC_KEYCLOAK_REALM),
    clientId: required(
      'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    ),
    onLoad: getOnLoad(),
  }
}


