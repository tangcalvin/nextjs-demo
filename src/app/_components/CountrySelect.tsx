'use client';

import { MenuItem, TextField, type TextFieldProps } from '@mui/material'

type CountrySelectProps = TextFieldProps & {
  /**
   * When true, include an "Any" option with empty value.
   * Otherwise, show a "Select…" placeholder for required fields.
   */
  includeAny?: boolean
}

export function CountrySelect({
  includeAny = false,
  ...textFieldProps
}: CountrySelectProps) {
  return (
    <TextField select {...textFieldProps}>
      {includeAny ? (
        <MenuItem value="">Any</MenuItem>
      ) : (
        <MenuItem value="">Select…</MenuItem>
      )}
      <MenuItem value="US">United States</MenuItem>
      <MenuItem value="UK">United Kingdom</MenuItem>
      <MenuItem value="HK">Hong Kong</MenuItem>
      <MenuItem value="AU">Australia</MenuItem>
    </TextField>
  )
}

export default CountrySelect


