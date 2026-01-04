'use client';

import { PropsWithChildren } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { AuthProvider, useAuth } from './_auth/AuthProvider'

const drawerWidth = 240

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
})

const navItems: { label: string; href: string }[] = [
  { label: 'Users', href: '/users' },
  { label: 'Contacts', href: '/contacts' },
]

function AppShell({ children }: PropsWithChildren) {
  const year = new Date().getFullYear()
  const { enabled, status, profile, tokenParsed, login, logout } = useAuth()

  // Extract and format token expiry time
  const getTokenExpiryText = (): string => {
    if (!tokenParsed || typeof tokenParsed !== 'object') return 'Token expiry unknown'
    
    const exp = (tokenParsed as Record<string, unknown>).exp
    if (!exp || typeof exp !== 'number') return 'Token expiry unknown'
    
    try {
      const expiryDate = new Date(exp * 1000) // Convert Unix timestamp to Date
      return `Token expires: ${expiryDate.toLocaleString()}`
    } catch {
      return 'Token expiry unknown'
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Next.js + MUI Demo
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
                    {enabled && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {profile && (
                          <Tooltip title={getTokenExpiryText()} arrow>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                cursor: 'help',
                              }}
                            >
                              <AccountCircleIcon fontSize="small" />
                              <Typography variant="body2">
                                {String(
                                  (profile as Record<string, unknown>).name ??
                                    (profile as Record<string, unknown>).preferred_username ??
                                    (profile as Record<string, unknown>).username ??
                                    (profile as Record<string, unknown>).email ??
                                    'User'
                                )}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => void (status === 'authenticated' ? logout() : login())}
                  disabled={status === 'loading'}
                >
                  {status === 'authenticated' ? <LogoutIcon /> : <LoginIcon />}
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
          }}
        >
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {navItems.map((item) => (
                  <ListItemButton
                    key={item.href}
                    component="a"
                    href={item.href}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Drawer>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Toolbar />
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{children}</Box>
          </Box>
        </Box>

        <Box
          component="footer"
          sx={(theme) => ({
            mt: 0,
            pt: 2,
            pb: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          })}
        >
          <Typography variant="body2" color="text.secondary">
            © {year} Demo Company. All rights reserved. ·{' '}
            <Link href="/site-map" underline="hover">
              Sitemap
            </Link>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export function MUIRoot({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}

export default MUIRoot


