import { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';

export type NorkartBasemapVariant =
  | 'standard'
  | 'standard-without-text'
  | 'greyscale'
  | 'greyscale-without-text'
  | 'darkmode'
  | 'transparent'
  | 'hybrid'
  | 'ortofoto';
const BASEMAP_OPTIONS: { value: NorkartBasemapVariant; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'standard-without-text', label: 'Standard uten tekst' },
  { value: 'greyscale', label: 'Gråtoner' },
  { value: 'greyscale-without-text', label: 'Gråtoner uten tekst' },
  { value: 'darkmode', label: 'Mørkt kart (darkmode)' },
  { value: 'ortofoto', label: 'Flyfoto (ortofoto)' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'transparent', label: 'Transparent' },
];

export function BasemapSelector({ basemap, onChange }: { basemap: NorkartBasemapVariant; onChange: (value: NorkartBasemapVariant) => void }) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  return (
      <div
        style={{ flexShrink: 0 }}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Button
          id="basemap-button"
          variant="contained"
          aria-haspopup="menu"
          aria-controls={menuAnchor ? 'basemap-menu' : undefined}
          aria-expanded={Boolean(menuAnchor)}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{
            bgcolor: 'white', color: '#172b24', borderRadius: 3,
            px: 2, py: 1.25, textTransform: 'none', fontWeight: 700,
            '&:hover': { bgcolor: '#eef7f1' },
          }}
        >
          Karttype ▾
        </Button>
        <Menu
          id="basemap-menu"
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            list: { 'aria-labelledby': 'basemap-button' },
            paper: { sx: { mt: 1, maxHeight: 280, width: 260, overflowY: 'auto', borderRadius: 3 } },
          }}
        >
          {BASEMAP_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={basemap === option.value}
              role="menuitemradio"
              aria-checked={basemap === option.value}
              onClick={() => {
                onChange(option.value);
                setMenuAnchor(null);
              }}
              sx={{ minHeight: 44, gap: 1 }}
            >
              <span aria-hidden="true" style={{ width: 18 }}>{basemap === option.value ? '✓' : ''}</span>
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </div>
  );
}
