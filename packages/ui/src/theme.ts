'use client';
import { createTheme } from '@mui/material/styles';

/**
 * Ledger palette: ink-blue for structure, a single "credit green" reserved for money
 * moving in. Green appears nowhere else, so when it shows up it means a balance changed.
 */
export const palette = {
  ink: '#1F3A5F',
  inkDeep: '#142844',
  credit: '#17785A',
  canvas: '#F5F6F8',
  line: '#E1E5EB',
  text: '#172033',
  muted: '#5B6577',
  danger: '#B42318',
};

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: palette.ink, dark: palette.inkDeep, contrastText: '#fff' },
    success: { main: palette.credit, contrastText: '#fff' },
    error: { main: palette.danger },
    background: { default: palette.canvas, paper: '#FFFFFF' },
    text: { primary: palette.text, secondary: palette.muted },
    divider: palette.line,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, "SF Pro Text", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 650, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.25rem', fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: palette.muted, backgroundColor: '#FAFBFC' },
      },
    },
  },
});
