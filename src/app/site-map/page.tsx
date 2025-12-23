import { Container, List, ListItem, ListItemText, Paper, Typography } from '@mui/material'

const routes: { label: string; href: string }[] = [
  { label: 'Users', href: '/users' },
  { label: 'Contacts', href: '/contacts' },
]

export default function SitemapPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sitemap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          List of main pages in this demo application.
        </Typography>
        <List>
          {routes.map((route) => (
            <ListItem
              key={route.href}
              component="a"
              href={route.href}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemText primary={route.label} secondary={route.href} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  )
}


