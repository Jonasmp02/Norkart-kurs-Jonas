import { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { BasemapSelector, type NorkartBasemapVariant } from './components/BasemapSelector';
import Header from './components/Header';
import { MapLibreMap } from './components/MapLibreMap';
import './index.css';
import { SearchBar, type Address } from './components/SearchBar';
import meme67 from './assets/67 meme.gif';

function App() {
  const [basemap, setBasemap] = useState<NorkartBasemapVariant>('standard');
  const [address, setAddress] = useState<Address | null>(null);
  const [showMeme, setShowMeme] = useState(false);
  const [drawingRoadworks, setDrawingRoadworks] = useState(false);
  const [planningRoute, setPlanningRoute] = useState(false);
  const memeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(memeTimer.current), []);

  const selectAddress = (selectedAddress: Address | null) => {
    setAddress(selectedAddress);
    clearTimeout(memeTimer.current);
    const matches = selectedAddress?.PayLoad.Text.includes('67') ?? false;
    setShowMeme(matches);
    if (matches) {
      memeTimer.current = setTimeout(() => setShowMeme(false), 5000);
    }
  };
  return (
    <>
      <Header search={<SearchBar setAddress={selectAddress} />}>
        <Button
          variant="contained"
          aria-pressed={planningRoute}
          onClick={() => { setPlanningRoute((value) => !value); setDrawingRoadworks(false); }}
          sx={{
            bgcolor: planningRoute ? '#1a73e8' : 'white', color: planningRoute ? 'white' : '#172b24',
            borderRadius: 3, px: 2, py: 1.25, textTransform: 'none', fontWeight: 700, flexShrink: 0,
            '&:hover': { bgcolor: planningRoute ? '#1558b0' : '#e8f0fe' },
          }}
        >
          🧭 {planningRoute ? 'Lukk rute' : 'Rute'}
        </Button>
        <Button
          variant="contained"
          aria-pressed={drawingRoadworks}
          onClick={() => { setDrawingRoadworks((value) => !value); setPlanningRoute(false); }}
          sx={{
            bgcolor: drawingRoadworks ? '#c66a06' : 'white', color: drawingRoadworks ? 'white' : '#172b24',
            borderRadius: 3, px: 2, py: 1.25, textTransform: 'none', fontWeight: 700, flexShrink: 0,
            '&:hover': { bgcolor: drawingRoadworks ? '#a85a05' : '#fff3d6' },
          }}
        >
          🚧 {drawingRoadworks ? 'Avslutt tegning' : 'Veiarbeid'}
        </Button>
        <BasemapSelector basemap={basemap} onChange={setBasemap} />
      </Header>
      <MapLibreMap basemap={basemap} address={address} drawingRoadworks={drawingRoadworks} onDrawingRoadworksChange={setDrawingRoadworks} planningRoute={planningRoute} onPlanningRouteChange={setPlanningRoute} />
      {showMeme && (
        <div
          role="status"
          style={{
            position: 'fixed', inset: 'var(--header-height) 0 0',
            zIndex: 1250, display: 'grid', placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)', pointerEvents: 'none',
          }}
        >
          <img
            src={meme67}
            alt="67 meme"
            style={{ maxWidth: '85vw', maxHeight: '70dvh', objectFit: 'contain', borderRadius: 16, boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)' }}
          />
        </div>
      )}
    </>
  );
}

export default App;
