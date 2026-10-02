import { z } from 'zod';

const trimmed = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

const userBase = {
  name: trimmed('Name', 80),
  city: trimmed('City', 60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,13}$/, 'Mobile must be 10–13 digits, optionally starting with +'),
};

export const createUserSchema = z.object({
  ...userBase,
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export const updateUserSchema = z.object({
  ...userBase,
  // Optional on edit: leave blank to keep the current password.
  password: z
    .string()
    .max(72)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || v.length >= 6, 'Password must be at least 6 characters'),
});

export const addAmountSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount' })
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount must be 1,00,00,000 or less')
    .refine((v) => Math.round(v * 100) === Number((v * 100).toFixed(6)), 'Use at most 2 decimal places'),
  note: z.string().trim().max(140).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type AddAmountInput = z.infer<typeof addAmountSchema>;

/** Flattens zod errors into { field: message } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    out[key] ??= issue.message;
  }
  return out;
}
