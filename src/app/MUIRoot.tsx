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
  const { enabled, status, profile, login, logout } = useAuth()

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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccountCircleIcon fontSize="small" />
                            <Typography variant="body2">
                              {(profile as Record<string, unknown>).name ??
                                (profile as Record<string, unknown>).preferred_username ??
                                (profile as Record<string, unknown>).username ??
                                (profile as Record<string, unknown>).email ??
                                'User'}
                            </Typography>
                          </Box>
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


