'use client';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';

/** Switches between light and dark. MUI stores the choice and applies it before first paint on the next visit. */
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = (mode === 'system' ? systemMode : mode) ?? 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;
  return (
    <Tooltip title={label}>
      <IconButton onClick={() => setMode(next)} aria-label={label} size="small" color="inherit">
        {current === 'dark' ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
