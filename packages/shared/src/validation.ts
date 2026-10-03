import { z } from 'zod';

// Shared by the API routes and the forms, so browser and server always agree on what's valid.

/* ------------------------------------------------------------------ email */

const EMAIL_MAX = 254; // RFC 5321 path limit
const LOCAL_MAX = 64;
const LOCAL_CHARS = /^[a-z0-9._%+-]+$/;
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD = /^[a-z]{2,24}$/;

/** Misspellings of the most common providers. Rejecting these catches typos that would lock a user out. */
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'rediffmial.com': 'rediffmail.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
};
/** Endings that are never real TLDs but are easy to type by mistake. */
const TLD_TYPOS: Record<string, string> = { con: 'com', cmo: 'com', ocm: 'com', comm: 'com', cpm: 'com', vom: 'com', xom: 'com', nte: 'net', ogr: 'org' };

/** Returns why an (already trimmed, lowercased) email is invalid, or null if it's fine. */
export function emailProblem(email: string, { typoHints = true } = {}): string | null {
  if (!email) return 'Email is required';
  if (/\s/.test(email)) return 'Email cannot contain spaces';
  if (email.length > EMAIL_MAX) return `Email must be ${EMAIL_MAX} characters or fewer`;

  const at = email.split('@');
  if (at.length === 1) return 'Email must include an @, e.g. name@example.com';
  if (at.length > 2) return 'Email can only contain one @';
  const [local, domain] = at;

  if (!local) return 'Enter the part before the @';
  if (local.length > LOCAL_MAX) return `The part before the @ must be ${LOCAL_MAX} characters or fewer`;
  if (!LOCAL_CHARS.test(local)) return 'Before the @, use only letters, numbers and . _ % + -';
  if (local.startsWith('.') || local.endsWith('.')) return 'The part before the @ cannot start or end with a dot';
  if (local.includes('..')) return 'Email cannot contain two dots in a row';

  if (!domain) return 'Enter the domain after the @, e.g. gmail.com';
  if (domain.includes('..')) return 'Email cannot contain two dots in a row';
  if (domain.startsWith('.') || domain.endsWith('.')) return 'The domain cannot start or end with a dot';
  const labels = domain.split('.');
  if (labels.length < 2) return 'The domain needs an ending, e.g. .com or .in';
  if (!labels.every((l) => DOMAIN_LABEL.test(l))) {
    return 'The domain can only use letters, numbers and hyphens, and cannot start or end with a hyphen';
  }
  const tld = labels[labels.length - 1];
  if (!TLD.test(tld)) return `".${tld}" is not a valid domain ending`;
  if (!typoHints) return null;

  const typo = DOMAIN_TYPOS[domain];
  if (typo) return `Did you mean ${local}@${typo}?`;
  const tldTypo = TLD_TYPOS[tld];
  if (tldTypo) return `Did you mean ${local}@${labels.slice(0, -1).join('.')}.${tldTypo}?`;
  return null;
}

const email = (options?: { typoHints?: boolean }) =>
  z
    .string({ required_error: 'Email is required', invalid_type_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .superRefine((value, ctx) => {
      const problem = emailProblem(value, options);
      if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    });

/** For new and edited addresses: also rejects common provider typos like gmail.con. */
export const emailField = email();
/** For sign-in: same format rules, but no typo hints, so an address saved earlier can always sign in. */
const loginEmailField = email({ typoHints: false });

/* ----------------------------------------------------------- other fields */

/** Letters (any language), spaces and . ' - only; runs of spaces collapse to one. */
const personText = (label: string, min: number, max: number) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .min(min, `${label} must be at least ${min} characters`)
        .max(max, `${label} must be ${max} characters or fewer`)
        .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, `${label} can only contain letters, spaces and . ' -`),
    );

/** Accepts common formatting (spaces, dashes, brackets) and stores digits only, with an optional leading +. */
const mobileField = z
  .string({ required_error: 'Mobile is required', invalid_type_error: 'Mobile is required' })
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(
    z
      .string()
      .min(1, 'Mobile is required')
      .regex(/^\+?\d+$/, 'Mobile can only contain digits, with an optional + at the start')
      .regex(/^\+?\d{10,13}$/, 'Mobile must be 10–13 digits')
      .refine((v) => !/^\+?(\d)\1+$/.test(v), 'Enter a real mobile number'),
  );

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // bcrypt ignores anything past 72 bytes
const passwordRules = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be ${PASSWORD_MAX} characters or fewer`)
  .refine((v) => v.trim().length > 0, 'Password cannot be only spaces')
  .refine((v) => v === v.trim(), 'Password cannot start or end with a space');

/* ---------------------------------------------------------------- schemas */

export const loginSchema = z.object({
  email: loginEmailField,
  password: z
    .string({ required_error: 'Enter your password', invalid_type_error: 'Enter your password' })
    .min(1, 'Enter your password'),
});

const userBase = {
  name: personText('Name', 2, 80),
  city: personText('City', 2, 60),
  email: emailField,
  mobile: mobileField,
};

export const createUserSchema = z.object({
  ...userBase,
  password: z
    .string({ required_error: 'Password is required', invalid_type_error: 'Password is required' })
    .min(1, 'Password is required')
    .pipe(passwordRules),
});

export const updateUserSchema = z.object({
  ...userBase,
  // Optional on edit: leave blank to keep the current password.
  password: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(passwordRules.optional()),
});

export const AMOUNT_MAX = 10_000_000;

/** Takes a number or a numeric string; rejects anything else (booleans, "1e3", "12abc") with a clear message. */
const amountField = z
  .unknown()
  .transform((v, ctx) => {
    const s = typeof v === 'number' ? String(v) : typeof v === 'string' ? v.trim() : '';
    if (!s) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an amount' });
      return z.NEVER;
    }
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a number, e.g. 250 or 99.50' });
      return z.NEVER;
    }
    if (/\.\d{3,}$/.test(s)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use at most 2 decimal places' });
      return z.NEVER;
    }
    return Number(s);
  })
  .pipe(
    z
      .number()
      .positive('Amount must be greater than 0')
      .max(AMOUNT_MAX, 'Amount must be ₹1,00,00,000 or less'),
  );

export const addAmountSchema = z.object({
  amount: amountField,
  note: z
    .string()
    .trim()
    .max(140, 'Note must be 140 characters or fewer')
    .optional()
    .transform((v) => (v ? v : undefined)),
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

/** Runs a schema in the browser and returns field errors, or an empty object when valid. */
export function validate(schema: z.ZodTypeAny, values: unknown): Record<string, string> {
  const result = schema.safeParse(values);
  return result.success ? {} : fieldErrors(result.error);
}
