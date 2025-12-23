'use client';

import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { useAuth } from './_auth/AuthProvider'

export default function HomePage() {
  const { enabled, status, login } = useAuth()

  const showLoginCta = enabled && status === 'unauthenticated'

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={600}>
          Next.js + MUI Demo Portal
        </Typography>

        <Typography variant="body1" color="text.secondary">
          This demo showcases a responsive layout with a persistent sidebar, user form,
          and contacts search, optionally protected by Keycloak authentication.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          {showLoginCta && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => void login()}
            >
              Sign in to continue
            </Button>
          )}

          <Button
            variant={showLoginCta ? 'outlined' : 'contained'}
            color="primary"
            href="/users"
          >
            Go to Users
          </Button>

          <Button
            variant="outlined"
            color="primary"
            href="/contacts"
          >
            Go to Contacts
          </Button>
        </Stack>

        {enabled && status === 'loading' && (
          <Typography variant="caption" color="text.secondary">
            Initialising authentication…
          </Typography>
        )}

        {!enabled && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Authentication is currently disabled for this environment.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  )
}


