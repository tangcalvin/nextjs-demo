'use client';

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import LoadingBackdrop from '../_components/LoadingBackdrop'
import CountrySelect from '../_components/CountrySelect'
import StockAutocomplete from '../_components/StockAutocomplete'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { format } from 'date-fns'
import { LocalizationProvider, DatePicker, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserFormValues } from '../_schemas/userFormSchema'
import { AuthGate } from '../_auth/AuthCards'

export default function UserFormPage() {
  const [submitted, setSubmitted] = useState<UserFormValues | null>(null)
  const [apiResult, setApiResult] = useState<Record<string, unknown> | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      age: undefined,
      country: '',
      birthDate: undefined,
      appointment: undefined,
      favoriteOption: '',
    },
  })

  const watchedValues = useWatch<UserFormValues>({ control })

  const liveJson = useMemo(() => {
    if (!watchedValues) return null
    return {
      ...watchedValues,
      birthDate: watchedValues.birthDate
        ? format(watchedValues.birthDate, 'yyyy-MM-dd')
        : null,
      appointment: watchedValues.appointment
        ? format(watchedValues.appointment, "yyyy-MM-dd'T'HH:mm:ssXXX")
        : null,
    }
  }, [watchedValues])

  const onSubmit = async (data: UserFormValues) => {
    setSubmitted(data)
    setApiResult(null)
    setApiError(null)

    const payload = {
      ...data,
      birthDate: data.birthDate ? format(data.birthDate, 'yyyy-MM-dd') : null,
      appointment: data.appointment
        ? format(data.appointment, "yyyy-MM-dd'T'HH:mm:ssXXX")
        : null,
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed with status ${res.status}`)
      }

      const json = await res.json()
      setApiResult(json)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="md"
        sx={{ display: 'flex', justifyContent: 'center' }}
      >
        <AuthGate>
        <Paper
          sx={{
            p: 4,
            maxWidth: 720,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
        <LoadingBackdrop open={isSubmitting} text="Submitting…" />
        <Typography variant="h5" component="h1">
          User Details
        </Typography>

        <Typography variant="body2" color="text.secondary">
          This is a dummy form using React Hook Form + Zod for validation and MUI for UI controls.
        </Typography>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First name"
                fullWidth
                required
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last name"
                fullWidth
                required
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Age"
                type="number"
                fullWidth
                {...register('age')}
                error={Boolean(errors.age)}
                helperText={errors.age?.message ?? 'Optional'}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <FormControl component="fieldset" error={Boolean(errors.gender)} fullWidth>
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup row aria-label="gender">
                  <FormControlLabel
                    value="male"
                    control={<Radio />}
                    label="Male"
                    {...register('gender')}
                  />
                  <FormControlLabel
                    value="female"
                    control={<Radio />}
                    label="Female"
                    {...register('gender')}
                  />
                </RadioGroup>
                {errors.gender && (
                  <Typography variant="caption" color="error">
                    {errors.gender.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CountrySelect
                label="Country"
                fullWidth
                required
                defaultValue=""
                {...register('country')}
                error={Boolean(errors.country)}
                helperText={errors.country?.message ?? 'Select your country'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Birth date"
                    value={field.value ?? null}
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: Boolean(errors.birthDate),
                        helperText: errors.birthDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="appointment"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Preferred appointment"
                    value={field.value ?? null}
                    onChange={(value) => field.onChange(value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: Boolean(errors.appointment),
                        helperText:
                          errors.appointment?.message ?? 'Optional: date & time',
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="favoriteOption"
                control={control}
                render={({ field }) => (
                  <StockAutocomplete
                    value={field.value ?? null}
                    onChange={(val) => field.onChange(val ?? '')}
                    error={Boolean(errors.favoriteOption)}
                    helperText={errors.favoriteOption?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    reset()
                    setSubmitted(null)
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {submitted && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Last submitted data:
            </Typography>
            <pre
              style={{
                margin: 0,
                maxHeight: 200,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </Alert>
        )}

        {apiError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              API error:
            </Typography>
            {apiError}
          </Alert>
        )}

        {apiResult && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              API response:
            </Typography>
            <pre
              style={{
                margin: 0,
                maxHeight: 200,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </Alert>
        )}

        {liveJson && (
          <Box
            component={Paper}
            variant="outlined"
            sx={{ mt: 3, p: 2, maxHeight: 260, overflow: 'auto' }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Live form JSON (what would be sent if you submitted now):
            </Typography>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(liveJson, null, 2)}
            </pre>
          </Box>
        )}
        </Paper>
        </AuthGate>
      </Container>
    </LocalizationProvider>
  )
}


