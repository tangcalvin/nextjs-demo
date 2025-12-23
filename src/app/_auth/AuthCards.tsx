'use client';

import { Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import { useAuth } from './AuthProvider'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, enabled } = useAuth()

  if (!enabled) {
    // Auth disabled: render children directly.
    return <>{children}</>
  }

  if (status === 'loading') {
    return <LoadingCard />
  }

  if (status === 'error') {
    return <ErrorCard />
  }

  if (status === 'unauthenticated') {
    return <UnauthenticatedCard />
  }

  return <>{children}</>
}

export function LoadingCard() {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={20} />
        <Typography>Checking authentication…</Typography>
      </CardContent>
    </Card>
  )
}

export function ErrorCard() {
  const { error } = useAuth()
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="error" gutterBottom>
          Authentication error
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error ?? 'An unknown error occurred while initializing authentication.'}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function UnauthenticatedCard() {
  const { login } = useAuth()
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">Sign in required</Typography>
        <Typography variant="body2" color="text.secondary">
          This area requires authentication. Click the button below to sign in.
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => void login()}>
            Sign in
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}


