'use client';

import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { USER_OPTIONS, type UserOption } from '../_data/users'

const autocompleteFilter = createFilterOptions<UserOption>()

type StockAutocompleteProps = {
  value: string | null
  onChange: (value: string | null) => void
  error?: boolean
  helperText?: string
}

export function StockAutocomplete({
  value,
  onChange,
  error,
  helperText,
}: StockAutocompleteProps) {
  const selected =
    USER_OPTIONS.find((opt) => opt.id === value) ?? null

  return (
    <Autocomplete
      options={USER_OPTIONS}
      getOptionLabel={(opt) => `${opt.label} (${opt.id})`}
      filterOptions={(options, params) =>
        autocompleteFilter(options, params).slice(0, 10)
      }
      value={selected}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : null)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Stock"
          placeholder="Start typing to search..."
          fullWidth
          error={error}
          helperText={helperText}
        />
      )}
    />
  )
}

export default StockAutocomplete


