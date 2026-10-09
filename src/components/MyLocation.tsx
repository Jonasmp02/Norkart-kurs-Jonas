import { useEffect, useRef, useState } from 'react';
import { RMarker, useMap } from 'maplibre-react-components';

// Posisjonen hentes fra nettleseren og lagres ikke. Den sendes bare til Norkarts ruteberegner når du ber om en kjørerute.
const errors: Record<number, string> = {
  1: 'Nettleseren fikk ikke lov til å bruke posisjonen din. Tillat «Plassering» for siden (ikonet til venstre i adressefeltet), og sjekk at posisjonstjenester er slått på i Windows.',
  2: 'Fant ikke posisjonen din. Sjekk at posisjonstjenester er slått på i Windows.',
  3: 'Det tok for lang tid å finne posisjonen din. Prøv igjen.',
};

export function MyLocation({ onPositionChange }: { onPositionChange?: (position: [number, number]) => void }) {
  const map = useMap();
  const watchId = useRef<number | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const locate = () => {
    setError('');
    if (!window.isSecureContext) {
      setError('Posisjon virker bare når siden åpnes via localhost (eller https). Åpne http://localhost:5173 i stedet for en IP-adresse.');
      return;
    }
    if (!('geolocation' in navigator)) {
      setError('Denne nettleseren støtter ikke posisjon.');
      return;
    }
    if (position) map.flyTo({ center: position, zoom: Math.max(map.getZoom(), 15) });
    if (watchId.current !== null) return;

    setStatus('searching');
    let first = true;
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.longitude, coords.latitude];
        setPosition(next);
        onPositionChange?.(next);
        setStatus('found');
        setError('');
        if (first) {
          first = false;
          map.flyTo({ center: next, zoom: 15 });
        }
      },
      (err) => {
        setError(errors[err.code] ?? 'Kunne ikke hente posisjonen din.');
        setStatus(position ? 'found' : 'idle');
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  return <>
    {position && <RMarker longitude={position[0]} latitude={position[1]} onClick={(event) => event.stopPropagation()}>
      <div className="my-location" aria-label="Din posisjon">
        <span className="my-location-pulse" />
        <span className="my-location-dot" />
        <span className="my-location-label">Du er her</span>
      </div>
    </RMarker>}
    <div onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} style={{ position: 'absolute', right: 10, bottom: 44, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      {error && <div role="alert" onClick={() => setError('')} style={{ maxWidth: 300, padding: '10px 14px', borderRadius: 12, background: '#fdecea', color: '#7a1c14', boxShadow: '0 4px 18px #0002', fontSize: 13, cursor: 'pointer' }}>
        {error}
      </div>}
      <button
        type="button"
        onClick={locate}
        title="Vis min posisjon"
        aria-label="Vis min posisjon"
        style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'white', boxShadow: '0 2px 8px #0004', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, flexShrink: 0 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={status === 'idle' ? '#333' : '#1a73e8'} strokeWidth="2" className={status === 'searching' ? 'my-location-searching' : undefined}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" fill={status === 'found' ? '#1a73e8' : 'none'} />
          <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
        </svg>
      </button>
    </div>
  </>;
}
