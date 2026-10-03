'use client';
import { createTheme } from '@mui/material/styles';

/**
 * Tokens from DESIGN-binance.md. One accent (yellow) carries every primary action; everything
 * else is near-black / white surfaces with hairline borders. Light and dark share the yellow;
 * only canvas, surface and text tones flip. Up/down green and red are slightly deeper in light
 * mode so they stay readable as text on white.
 */
export const tokens = {
  primary: '#FCD535',
  primaryActive: '#F0B90B',
  primaryDisabledDark: '#3A3A1F',
  onPrimary: '#181A20',
  info: '#3B82F6',
  light: {
    canvas: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSoft: '#FAFAFA',
    surfaceStrong: '#F5F5F5',
    hairline: '#EAECEF',
    borderStrong: '#CDD1D6',
    ink: '#181A20',
    soft: '#474D57',
    muted: '#707A8A',
    up: '#03A66D',
    down: '#CF304A',
  },
  dark: {
    canvas: '#0B0E11',
    surface: '#1E2329',
    surfaceSoft: '#2B3139',
    surfaceStrong: '#2B3139',
    hairline: '#2B3139',
    borderStrong: '#474D57',
    ink: '#EAECEF',
    soft: '#B7BDC6',
    muted: '#929AA5',
    up: '#0ECB81',
    down: '#F6465D',
  },
};

const scheme = (t: typeof tokens.light) => ({
  primary: { main: tokens.primary, dark: tokens.primaryActive, contrastText: tokens.onPrimary },
  success: { main: t.up, contrastText: '#FFFFFF' },
  error: { main: t.down, contrastText: '#FFFFFF' },
  warning: { main: tokens.primaryActive, contrastText: tokens.onPrimary },
  info: { main: tokens.info, contrastText: '#FFFFFF' },
  background: { default: t.canvas, paper: t.surface },
  text: { primary: t.ink, secondary: t.soft, disabled: t.muted },
  divider: t.hairline,
  action: { hover: t.surfaceSoft, selected: t.surfaceStrong },
});

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  defaultColorScheme: 'light',
  colorSchemes: {
    light: { palette: scheme(tokens.light) },
    dark: { palette: scheme(tokens.dark) },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    h1: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
    button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', lineHeight: 1 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, whiteSpace: 'nowrap' },
        sizeMedium: { minHeight: 40, padding: '12px 24px' },
        sizeLarge: { minHeight: 48, padding: '14px 32px', fontSize: '1rem' },
        // button-subscribe: compact action that fits inside a table row.
        sizeSmall: { minHeight: 28, padding: '6px 16px', borderRadius: 4, fontSize: '0.8125rem' },
        containedPrimary: { '&:active': { backgroundColor: tokens.primaryActive } },
      },
      variants: [
        {
          // button-secondary: neutral surface + hairline instead of a coloured outline.
          props: { variant: 'outlined' },
          style: ({ theme }) => ({
            color: theme.vars.palette.text.primary,
            borderColor: theme.vars.palette.divider,
            backgroundColor: theme.vars.palette.background.paper,
            '&:hover': { borderColor: tokens.light.borderStrong, backgroundColor: theme.vars.palette.action.hover },
            ...theme.applyStyles('dark', { '&:hover': { borderColor: tokens.dark.borderStrong } }),
          }),
        },
        {
          props: { variant: 'contained', color: 'primary' },
          style: ({ theme }) =>
            theme.applyStyles('dark', {
              '&.Mui-disabled': { backgroundColor: tokens.primaryDisabledDark, color: tokens.dark.muted },
            }),
        },
      ],
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          backgroundImage: 'none',
          border: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.25rem', fontWeight: 600 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          backgroundColor: theme.vars.palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.divider },
          '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.light.borderStrong,
            ...theme.applyStyles('dark', { borderColor: tokens.dark.borderStrong }),
          },
          // Focus is one 2px border in the deeper brand yellow: it follows the label notch,
          // unlike an outer glow, and at 2px it stays visible on white.
          '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: tokens.primaryActive },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
        }),
        input: { paddingTop: 10, paddingBottom: 10, minHeight: 20 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focused:not(.Mui-error)': { color: theme.vars.palette.text.primary },
          '&.MuiInputLabel-sizeSmall:not(.MuiInputLabel-shrink)': { transform: 'translate(14px, 10px) scale(1)' },
        }),
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, fontSize: '0.75rem' } } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
        head: ({ theme }) => ({
          fontSize: '0.75rem',
          fontWeight: 500,
          color: tokens.light.muted,
          backgroundColor: theme.vars.palette.background.paper,
          ...theme.applyStyles('dark', { color: tokens.dark.muted }),
        }),
        sizeSmall: { paddingTop: 12, paddingBottom: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: tokens.dark.surface, color: tokens.dark.ink, fontSize: '0.75rem', borderRadius: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, alignItems: 'center' },
        // Toasts: a neutral card with a coloured icon and edge, not a solid block of colour.
        outlined: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          backgroundColor: theme.vars.palette.background.paper,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          ...theme.applyStyles('dark', { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }),
        }),
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: tokens.light.surfaceStrong,
          ...theme.applyStyles('dark', { backgroundColor: tokens.dark.surface }),
        }),
      },
    },
  },
});
