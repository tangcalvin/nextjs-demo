type OnLoadMode = 'login-required' | 'check-sso'

function required(name: string, value: string | undefined): string {
  if (value && value.trim().length > 0) return value
  throw new Error(
    `Missing required env var: ${name}. Set ${name} in your environment (e.g. .env.local) before starting the dev server.`,
  )
}

function getOnLoad(): OnLoadMode {
  const raw = process.env.NEXT_PUBLIC_OIDC_ONLOAD?.trim()
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
  refreshIntervalSeconds: number
  proactiveRefreshThresholdSeconds: number
}

export function readOidcEnv(): OidcEnv {
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

  function getRefreshInterval(): number {
    const raw = process.env.NEXT_PUBLIC_OIDC_REFRESH_INTERVAL_SECONDS?.trim()
    if (raw) {
      const parsed = Number.parseInt(raw, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
    return 15 // Default: 15 seconds
  }

  function getProactiveRefreshThreshold(): number {
    const raw = process.env.NEXT_PUBLIC_OIDC_PROACTIVE_REFRESH_THRESHOLD_SECONDS?.trim()
    if (raw) {
      const parsed = Number.parseInt(raw, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
    return 60 // Default: 60 seconds
  }

  if (!enabled) {
    return {
      enabled,
      authority: '',
      clientId: '',
      redirectUri: '',
      postLogoutRedirectUri: '',
      onLoad: 'check-sso',
      refreshIntervalSeconds: 15,
      proactiveRefreshThresholdSeconds: 60,
    }
  }

  const url = required('NEXT_PUBLIC_OIDC_URL', process.env.NEXT_PUBLIC_OIDC_URL)
  const realm = required('NEXT_PUBLIC_OIDC_REALM', process.env.NEXT_PUBLIC_OIDC_REALM)
  const clientId = required(
    'NEXT_PUBLIC_OIDC_CLIENT_ID',
    process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
  )

  // Build OIDC authority URL (e.g., Keycloak: ${url}/realms/${realm}, or direct OIDC issuer URL)
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
    refreshIntervalSeconds: getRefreshInterval(),
    proactiveRefreshThresholdSeconds: getProactiveRefreshThreshold(),
  }
}
