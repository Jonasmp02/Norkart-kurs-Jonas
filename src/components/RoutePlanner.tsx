import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@mui/material';
import { RMarker, useMap } from 'maplibre-react-components';
import type { MapMouseEvent } from 'maplibre-gl';
import { SearchBar } from './SearchBar';
import { Route } from './Route';

type Stop = { coord: [number, number]; label: string };
type Target = 'from' | 'to' | 'via';

const PANEL_WIDTH = 300;

// Ruteplanlegger: velg Fra og Til (adressesøk, min posisjon eller klikk i kartet), og legg til stopp underveis.
export function RoutePlanner({ myPosition, onClose, onPickingChange }: {
  myPosition: [number, number] | null;
  onClose: () => void;
  onPickingChange: (picking: boolean) => void;
}) {
  const map = useMap();
  const [from, setFrom] = useState<Stop | null>(null);
  const [to, setTo] = useState<Stop | null>(null);
  const [via, setVia] = useState<Stop[]>([]);
  const [picking, setPicking] = useState<Target | null>(null);
  const [notice, setNotice] = useState('');

  const place = useCallback((target: Target, stop: Stop) => {
    if (target === 'from') setFrom(stop);
    else if (target === 'to') setTo(stop);
    else setVia((current) => [...current, stop]);
  }, []);

  useEffect(() => {
    onPickingChange(picking !== null);
    if (!picking) return;
    const click = (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat;
      place(picking, { coord: [lng, lat], label: `Punkt i kartet (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setPicking(null);
    };
    const canvas = map.getCanvas();
    const previous = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    map.on('click', click);
    return () => { map.off('click', click); canvas.style.cursor = previous; };
  }, [map, picking, onPickingChange, place]);

  useEffect(() => () => onPickingChange(false), [onPickingChange]);

  const pickMyPosition = (target: 'from' | 'to') => {
    if (!myPosition) {
      setNotice('Trykk på «min posisjon»-knappen nede til høyre først, så appen vet hvor du er.');
      return;
    }
    setNotice('');
    place(target, { coord: myPosition, label: 'Min posisjon' });
  };

  const points = from && to ? [from.coord, ...via.map((stop) => stop.coord), to.coord] : null;

  const endpoint = (target: 'from' | 'to', title: string, stop: Stop | null, color: string, letter: string) => (
    <section style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Badge color={color}>{letter}</Badge>
        <strong>{title}</strong>
        {!stop && <span style={{ fontSize: 12, color: '#888' }}>Ikke valgt</span>}
      </div>
      <SearchBar text={stop?.label ?? ''} label={`${title}-adresse`} setAddress={(address) => {
        if (address) place(target, { coord: [address.PayLoad.Posisjon.X, address.PayLoad.Posisjon.Y], label: address.PayLoad.Text });
        else if (target === 'from') setFrom(null);
        else setTo(null);
      }} />
      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
        <Button size="small" onClick={() => pickMyPosition(target)}>📍 Min posisjon</Button>
        <Button size="small" variant={picking === target ? 'contained' : 'text'} onClick={() => setPicking(picking === target ? null : target)}>
          {picking === target ? 'Klikk i kartet …' : '🖱️ Velg i kartet'}
        </Button>
      </div>
    </section>
  );

  return <>
    {from && <RMarker longitude={from.coord[0]} latitude={from.coord[1]}><Badge color="#16a34a" big>A</Badge></RMarker>}
    {via.map((stop, index) => <RMarker key={index} longitude={stop.coord[0]} latitude={stop.coord[1]}><Badge color="#7c3aed" big>{index + 1}</Badge></RMarker>)}
    {to && <RMarker longitude={to.coord[0]} latitude={to.coord[1]}><Badge color="#dc2626" big>B</Badge></RMarker>}

    <Route points={points} rightOffset={PANEL_WIDTH + 40} />

    <div onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, width: PANEL_WIDTH, maxWidth: 'calc(100% - 20px)', maxHeight: 'calc(100% - 110px)', overflowY: 'auto', boxSizing: 'border-box', padding: 16, borderRadius: 16, background: '#f3f7ff', boxShadow: '0 4px 18px #0002' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ color: '#1a4fa0', fontSize: 16 }}>🧭 Planlegg rute</strong>
        <Button size="small" onClick={onClose}>Lukk</Button>
      </div>

      {endpoint('from', 'Fra', from, '#16a34a', 'A')}

      <section style={{ marginTop: 12 }}>
        <strong style={{ fontSize: 13 }}>Stopp underveis</strong>
        {via.length === 0 && <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>Ingen stopp lagt til.</p>}
        <ol style={{ listStyle: 'none', padding: 0, margin: '6px 0' }}>
          {via.map((stop, index) => <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 4 }}>
            <Badge color="#7c3aed">{index + 1}</Badge>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.label}</span>
            <button type="button" aria-label={`Fjern stopp ${index + 1}`} onClick={() => setVia((current) => current.filter((_, i) => i !== index))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>×</button>
          </li>)}
        </ol>
        <Button size="small" variant={picking === 'via' ? 'contained' : 'outlined'} onClick={() => setPicking(picking === 'via' ? null : 'via')}>
          {picking === 'via' ? 'Klikk i kartet …' : '+ Legg til stopp'}
        </Button>
      </section>

      {endpoint('to', 'Til', to, '#dc2626', 'B')}

      {notice && <p role="alert" style={{ fontSize: 12, color: '#7a1c14', background: '#fdecea', padding: '6px 10px', borderRadius: 8 }}>{notice}</p>}

      <div style={{ display: 'flex', gap: 4, marginTop: 12, borderTop: '1px solid #d6e2f5', paddingTop: 8 }}>
        <Button size="small" disabled={!from && !to} onClick={() => { setFrom(to); setTo(from); setVia((current) => [...current].reverse()); }}>⇅ Bytt retning</Button>
        <Button size="small" color="error" disabled={!from && !to && !via.length} onClick={() => { setFrom(null); setTo(null); setVia([]); setPicking(null); }}>Nullstill</Button>
      </div>
      {!points && <p style={{ fontSize: 12, color: '#555', marginBottom: 0 }}>Velg både Fra og Til for å se raskeste kjørerute.</p>}
    </div>
  </>;
}

function Badge({ color, big, children }: { color: string; big?: boolean; children: ReactNode }) {
  const size = big ? 28 : 20;
  return <span style={{ display: 'inline-grid', placeItems: 'center', flexShrink: 0, width: size, height: size, borderRadius: '50%', background: color, color: 'white', fontWeight: 700, fontSize: big ? 14 : 11, border: big ? '3px solid white' : 'none', boxShadow: big ? '0 2px 6px #0006' : 'none', pointerEvents: 'none' }}>{children}</span>;
}
