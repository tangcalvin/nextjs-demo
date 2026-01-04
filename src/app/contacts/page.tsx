'use client';

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type Contact } from '../_data/contacts'
import DataTableSkeleton from '../_components/DataTableSkeleton'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { contactQuerySchema, type ContactQueryValues } from '../_schemas/contactQuerySchema'
import CountrySelect from '../_components/CountrySelect'
import { AuthGate } from '../_auth/AuthCards'

function filterContacts(data: Contact[], criteria: ContactQueryValues): Contact[] {
  return data.filter((c) => {
    if (criteria.firstName && !c.firstName.toLowerCase().includes(criteria.firstName.toLowerCase())) {
      return false
    }
    if (criteria.lastName && !c.lastName.toLowerCase().includes(criteria.lastName.toLowerCase())) {
      return false
    }
    if (criteria.email && !c.email.toLowerCase().includes(criteria.email.toLowerCase())) {
      return false
    }
    if (criteria.country && c.country !== criteria.country) {
      return false
    }
    if (criteria.status && c.status !== criteria.status) {
      return false
    }
    return true
  })
}

export default function ContactQueryPage() {
  const [results, setResults] = useState<Contact[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ContactQueryValues>({
    resolver: zodResolver(contactQuerySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
      status: '',
    },
  })

  const hasResults = useMemo(
    () => (results ? results.length > 0 : false),
    [results],
  )

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'firstName', headerName: 'First name', flex: 1 },
    { field: 'lastName', headerName: 'Last name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'country', headerName: 'Country', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdAt', headerName: 'Created at', width: 140 },
    {
      field: 'refreshed_at',
      headerName: 'Refreshed at',
      width: 180,
      valueFormatter: (value) => {
        if (!value) return ''
        try {
          const date = new Date(value as string)
          return date.toLocaleString()
        } catch {
          return value as string
        }
      },
    },
  ]

  const onSubmit = async (data: ContactQueryValues) => {
    setError(null)
    setHasSearched(true)

    try {
      setLoading(true)

      const res = await fetch('/api/contacts')
      if (!res.ok) {
        throw new Error(`Failed to load contacts (${res.status})`)
      }
      const json = (await res.json()) as { ok: boolean; data: Contact[] }
      if (!json.ok) {
        throw new Error('API indicated failure loading contacts')
      }

      // Artificial delay to make the skeleton visible even on fast responses.
      await new Promise((resolve) => setTimeout(resolve, 800))

      setResults(filterContacts(json.data, data))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Contact Query
      </Typography>

      <AuthGate>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search criteria
        </Typography>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="First name"
              {...register('firstName')}
              size="small"
              error={Boolean(errors.firstName)}
              helperText={errors.firstName?.message}
            />
            <TextField
              label="Last name"
              {...register('lastName')}
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
              size="small"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <CountrySelect
              label="Country"
              {...register('country')}
              size="small"
              sx={{ minWidth: 140 }}
              includeAny
              error={Boolean(errors.country)}
              helperText={errors.country?.message}
            />
            <TextField
              select
              label="Status"
              {...register('status')}
              size="small"
              sx={{ minWidth: 140 }}
              error={Boolean(errors.status)}
              helperText={errors.status?.message}
              SelectProps={{ native: true }}
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Searching…' : 'Search'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                reset()
                setResults(null)
                setError(null)
                setHasSearched(false)
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to run query: {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Results {results ? `(${results.length})` : ''}
        </Typography>
        {loading && hasSearched ? (
          <TableContainer sx={{ maxHeight: 480 }}>
            <DataTableSkeleton
              columns={[
                { label: 'ID' },
                { label: 'First name' },
                { label: 'Last name' },
                { label: 'Email' },
                { label: 'Country' },
                { label: 'Status' },
                { label: 'Created at' },
                { label: 'Refreshed at' },
              ]}
              rowCount={8}
            />
          </TableContainer>
        ) : hasResults && results ? (
          <Box sx={{ height: 480, width: '100%' }}>
            <DataGrid
              rows={results}
              columns={columns}
              disableRowSelectionOnClick
              density="compact"
              pageSizeOptions={[8, 16, 32]}
              initialState={{
                pagination: { paginationModel: { pageSize: 8, page: 0 } },
              }}
            />
          </Box>
        ) : hasSearched ? (
          <Typography variant="body2" color="text.secondary">
            No contacts match the current criteria.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Enter criteria above and click Search to see matching contacts.
          </Typography>
        )}
      </Paper>
      </AuthGate>
    </Container>
  )
}


