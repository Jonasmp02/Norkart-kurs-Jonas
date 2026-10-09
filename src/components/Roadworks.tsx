import { useEffect, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { RLayer, RMarker, RSource, useMap } from 'maplibre-react-components';
import type { Feature, Geometry, Position } from 'geojson';
import type { MapMouseEvent } from 'maplibre-gl';

// 1 punkt = et sted, 2 punkter = en veistrekning, 3+ punkter = et område.
type Area = { id: string; description: string; points: Position[] };
const storageKey = 'norkart-roadworks-v1';

const isPoint = (p: unknown): p is Position => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);

function geometryFor(points: Position[]): Geometry {
  if (points.length === 1) return { type: 'Point', coordinates: points[0] };
  if (points.length === 2) return { type: 'LineString', coordinates: points };
  return { type: 'Polygon', coordinates: [[...points, points[0]]] };
}

function center(points: Position[]): Position {
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function kind(count: number) {
  return count === 1 ? 'sted' : count === 2 ? 'strekning' : 'område';
}

export function Roadworks({ drawing, onDrawingChange }: { drawing: boolean; onDrawingChange: (value: boolean) => void }) {
  const map = useMap();
  const [points, setPoints] = useState<Position[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      return Array.isArray(saved) ? saved.filter((a) => typeof a.id === 'string' && typeof a.description === 'string' && Array.isArray(a.points) && a.points.length >= 1 && a.points.every(isPoint)) : [];
    } catch { return []; }
  });

  const [zoom, setZoom] = useState(() => map.getZoom());
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom', onZoom);
    return () => { map.off('zoom', onZoom); };
  }, [map]);

  useEffect(() => {
    if (!drawing) { setPoints([]); return; }
    setSelected(null);
    const click = (event: MapMouseEvent) => setPoints((current) => [...current, [event.lngLat.lng, event.lngLat.lat]]);
    const canvas = map.getCanvas();
    const previous = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    map.on('click', click);
    return () => { map.off('click', click); canvas.style.cursor = previous; };
  }, [map, drawing]);

  const persist = (next: Area[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setError('Kunne ikke lagre i nettleseren. Prøv igjen.'); return false; }
    setAreas(next);
    setError('');
    return true;
  };
  const save = () => {
    if (!points.length) return;
    if (persist([...areas, { id: crypto.randomUUID(), description: description.trim() || 'Veiarbeid', points }])) {
      setDescription(''); onDrawingChange(false);
    }
  };
  const chosen = areas.find((area) => area.id === selected);
  // Skiltet krymper når du zoomer ut (0.35 ved zoom 10, full størrelse fra zoom 17), og teksten skjules langt unna.
  const markerScale = Math.min(1, Math.max(0.35, 0.35 + (zoom - 10) * (0.65 / 7)));
  const showLabel = zoom >= 14;
  const features: Feature[] = [...areas, ...(points.length ? [{ id: 'draft', description, points }] : [])].map((area) => ({
    type: 'Feature', properties: { id: area.id }, geometry: geometryFor(area.points),
  }));

  return <>
    <RSource id="roadworks" type="geojson" data={{ type: 'FeatureCollection', features }} />
    <RLayer id="roadworks-fill" source="roadworks" type="fill" filter={['==', ['geometry-type'], 'Polygon']} paint={{ 'fill-color': '#f97316', 'fill-opacity': 0.35 }} />
    <RLayer id="roadworks-casing" source="roadworks" type="line" filter={['!=', ['geometry-type'], 'Point']} paint={{ 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 6, 18, 11] }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
    <RLayer id="roadworks-line" source="roadworks" type="line" filter={['!=', ['geometry-type'], 'Point']} paint={{ 'line-color': '#dc2626', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 6], 'line-dasharray': [1.5, 1] }} layout={{ 'line-join': 'round' }} />
    {/* Sirkelen følger kartets målestokk: liten når du zoomer ut, større når du zoomer inn */}
    <RLayer id="roadworks-point" source="roadworks" type="circle" filter={['==', ['geometry-type'], 'Point']} paint={{
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, 1.5, 14, 6, 17, 18, 20, 60],
      'circle-color': '#f97316', 'circle-opacity': 0.3, 'circle-stroke-color': '#dc2626',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 2.5],
    }} />

    {points.map((point, index) => <RMarker key={index} longitude={point[0]} latitude={point[1]}><span style={{ background: '#dc2626', color: 'white', border: '2px solid white', borderRadius: '50%', padding: '2px 7px', fontWeight: 700, pointerEvents: 'none', boxShadow: '0 1px 4px #0005' }}>{index + 1}</span></RMarker>)}

    {areas.map((area) => {
      const [lng, lat] = center(area.points);
      return <RMarker key={area.id} longitude={lng} latitude={lat} initialAnchor="bottom" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={`roadwork-marker${selected === area.id ? ' is-selected' : ''}`} onClick={() => setSelected(area.id)} aria-label={`Veiarbeid: ${area.description}`} style={{ transform: `scale(${markerScale})` }}>
          {showLabel && <span className="roadwork-label">{area.description}</span>}
          <span className="roadwork-sign" aria-hidden="true">
            <svg viewBox="0 0 48 44" width="36" height="33">
              <path d="M24 3 L45 40 H3 Z" fill="#facc15" stroke="#b91c1c" strokeWidth="4" strokeLinejoin="round" />
              <path d="M24 15 V28" stroke="#111" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="24" cy="34" r="2.6" fill="#111" />
            </svg>
          </span>
        </button>
      </RMarker>;
    })}

    {(drawing || chosen || error) && <div onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, width: 270, maxWidth: 'calc(100% - 20px)', padding: 16, borderRadius: 16, background: '#fff8e9', boxShadow: '0 4px 18px #0002' }}>
      <strong style={{ color: '#814507' }}>🚧 {drawing ? 'Tegn veiarbeid' : 'Veiarbeid'}</strong>
      {drawing ? <>
        <p style={{ fontSize: 13 }}>Klikk i kartet. Ett punkt markerer et sted, to punkter en veistrekning, og tre eller flere et område.</p>
        <TextField label="Beskrivelse" placeholder="F.eks. Vei sperret" value={description} onChange={(event) => setDescription(event.target.value)} size="small" fullWidth multiline maxRows={3} />
        <p style={{ fontSize: 12 }}>
          {points.length ? `${points.length} ${points.length === 1 ? 'punkt' : 'punkter'} – lagres som ${kind(points.length)}` : 'Ingen punkter ennå'} · lagres bare i denne nettleseren
        </p>
        <Button variant="contained" color="warning" disabled={!points.length} onClick={save}>Lagre</Button>
        <Button disabled={!points.length} onClick={() => setPoints((current) => current.slice(0, -1))}>Angre punkt</Button>
        <Button onClick={() => onDrawingChange(false)}>Avbryt</Button>
      </> : chosen && <>
        <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{chosen.description}</p>
        <Button color="error" onClick={() => { if (persist(areas.filter((area) => area.id !== chosen.id))) setSelected(null); }}>Slett</Button>
        <Button onClick={() => setSelected(null)}>Lukk</Button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>}
  </>;
}
