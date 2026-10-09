import { useEffect, useRef, useState } from 'react';
import { LngLatBounds } from 'maplibre-gl';
import { RLayer, RSource, useMap } from 'maplibre-react-components';
import type { Position } from 'geojson';
import { getRuteMellomPunkter, type Rute } from '../api/getRuteMellomPunkter';

// Tegner raskeste kjørerute gjennom punktene: start, eventuelle stopp underveis, og mål.
export function Route({ points, hint, rightOffset = 80 }: { points: [number, number][] | null; hint?: string | null; rightOffset?: number }) {
  const map = useMap();
  const [route, setRoute] = useState<Rute | undefined>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [hidden, setHidden] = useState(false);
  const rightOffsetRef = useRef(rightOffset);
  rightOffsetRef.current = rightOffset;
  const key = points && points.length >= 2 ? JSON.stringify(points) : '';

  useEffect(() => {
    setRoute(undefined);
    setHidden(false);
    if (!key) { setStatus('idle'); return; }
    const all: [number, number][] = JSON.parse(key);
    const start = all[0];
    const stop = all[all.length - 1];
    let cancelled = false;
    setStatus('loading');
    getRuteMellomPunkter(start[0], start[1], stop[0], stop[1], all.slice(1, -1)).then((result) => {
      if (cancelled) return;
      if (!result) { setStatus('error'); return; }
      setRoute(result);
      setStatus('idle');
      const bounds = new LngLatBounds();
      linesOf(result).flat().forEach((p) => bounds.extend([p[0], p[1]]));
      map.fitBounds(bounds, { padding: { top: 80, bottom: 90, left: 360, right: rightOffsetRef.current }, maxZoom: 16 });
    });
    return () => { cancelled = true; };
  }, [key, map]);

  const minutes = route ? travelMinutes(route) : undefined;
  const km = route ? lengthKm(route) : 0;
  const message =
    status === 'loading' ? 'Beregner raskeste kjørerute …'
    : status === 'error' ? 'Fant ingen kjørerute mellom disse punktene.'
    : key ? null
    : hint ?? null;

  return <>
    {route && !hidden && <>
      <RSource id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: route.geometry }} />
      <RLayer id="route-casing" source="route" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 11] }} />
      <RLayer id="route-line" source="route" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#1a73e8', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 7] }} />
    </>}
    {(message || (route && !hidden)) && <div onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} role="status" style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', maxWidth: 'calc(100% - 140px)', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 14, background: 'white', boxShadow: '0 4px 18px #0003', fontSize: 14 }}>
      {message ?? <>
        <span style={{ fontSize: 20 }} aria-hidden="true">🚗</span>
        <span>
          <strong>{minutes !== undefined ? formatMinutes(minutes) : 'Kjørerute'}</strong>
          <span style={{ color: '#555' }}> · {km.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} km</span>
        </span>
        <button type="button" onClick={() => setHidden(true)} aria-label="Skjul rute" style={{ border: 'none', background: '#eef2f7', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Skjul</button>
      </>}
    </div>}
  </>;
}

function linesOf(route: Rute): Position[][] {
  return route.geometry.type === 'LineString' ? [route.geometry.coordinates] : route.geometry.coordinates;
}

// Lengde regnes ut fra selve linja, så den er riktig uansett hva API-et returnerer.
function lengthKm(route: Rute) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  let total = 0;
  for (const line of linesOf(route)) {
    for (let i = 1; i < line.length; i++) {
      const [lng1, lat1] = line[i - 1];
      const [lng2, lat2] = line[i];
      const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
      total += 2 * R * Math.asin(Math.sqrt(a));
    }
  }
  return total;
}

// Kjøretid hentes fra CostList. Tidskostnaden oppgis i minutter (Kristiansand–Trondheim ≈ 660).
function travelMinutes(route: Rute) {
  for (const cost of route.costs) {
    const name = String(cost.Name ?? cost.CostFunction ?? cost.Type ?? '').toLowerCase();
    const value = Number(cost.Cost ?? cost.Value);
    if (name.includes('time') && Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} t ${m} min` : `${h} t`;
}
