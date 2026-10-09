import { Card, CardContent, Typography } from '@mui/material';
import type { Bygning } from '../api/getBygningAtPunkt';

export function BuildingInfo({ building, loading }: { building?: Bygning; loading: boolean }) {
  const data = building?.MatrikkelData;
  const yesNo = (value?: boolean) => value === undefined ? 'Ikke oppgitt' : value ? 'Ja' : 'Nei';
  const rows = [
    ['Bygningsnummer', building?.Bygningsnummer ?? data?.Bygningsnummer],
    ['Bygningstype', data?.Bygningstype],
    ['Status', data?.Bygningstatus],
    ['Næringsgruppe', data?.Naringsgruppe],
    ['Antatt byggeår', data?.AntattByggeaar && data.AntattByggeaar > 0 ? data.AntattByggeaar : undefined],
    ['SEFRAK-registrert', yesNo(data?.HarSefrakminne)],
    ['Kulturminne', yesNo(data?.HarKulturminne)],
  ];

  return (
    <Card elevation={0} sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #b7ddc6', background: 'transparent', color: 'inherit', borderRadius: 0 }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>Bygningsinformasjon</Typography>
        <div aria-live="polite">
          {loading ? <Typography>Henter bygningsdata …</Typography> : building ? (
            <dl style={{ margin: '8px 0 0' }}>
              {rows.map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 10, padding: '7px 0', borderBottom: '1px solid #cce7d7', overflowWrap: 'anywhere' }}>
                  <Typography component="dt" sx={{ fontSize: 12, color: '#456a55' }}>{label}</Typography>
                  <Typography component="dd" sx={{ m: 0, fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value === undefined || value === null || value === '' ? 'Ikke oppgitt' : value}</Typography>
                </div>
              ))}
            </dl>
          ) : <Typography variant="body2">Ingen bygningsdata tilgjengelig for dette punktet.</Typography>}
        </div>
      </CardContent>
    </Card>
  );
}
