import { z } from 'zod'

export const userSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .refine(
      (value) => value === undefined || (Number.isInteger(value) && value > 0),
      'Age must be a positive integer',
    ),
  gender: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.enum(['male', 'female'], {
      required_error: 'Gender is required',
    }),
  ),
  country: z
    .string()
    .min(1, 'Country is required'),
  birthDate: z
    .date({
      required_error: 'Birth date is required',
      invalid_type_error: 'Birth date is required',
    }),
  appointment: z
    .date()
    .optional(),
  favoriteOption: z.string().min(1, 'Stock is required'),
})

export type UserFormValues = z.infer<typeof userSchema>


