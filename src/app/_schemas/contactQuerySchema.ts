import { z } from 'zod'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const contactQuerySchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    lastName: z
      .string()
      .trim()
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    email: z
      .string()
      .trim()
      .transform((v) => (v === '' ? undefined : v))
      .refine(
        (v) => v === undefined || emailPattern.test(v),
        'Please enter a valid email address',
      )
      .optional(),
    country: z
      .string()
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    status: z
      .string()
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasAny =
      data.firstName ||
      data.lastName ||
      data.email ||
      data.country ||
      data.status

    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter at least one search criterion.',
        path: ['firstName'],
      })
    }
  })

export type ContactQueryValues = z.infer<typeof contactQuerySchema>


