import {
  LngLat,
  type MapLayerMouseEvent,
  type RequestTransformFunction,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RLayer, RMap, RMarker, RSource, useMap } from 'maplibre-react-components';
import type { GeoJSON } from 'geojson';
import { getBygningAtPunkt, type Bygning } from '../api/getBygningAtPunkt';
import { BuildingInfo } from './BuildingInfo';
import { Roadworks } from './Roadworks';
import { MyLocation } from './MyLocation';
import { Route } from './Route';
import { RoutePlanner } from './RoutePlanner';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import { useEffect, useRef, useState } from 'react';
import { Overlay } from './Overlay';
import DrawComponent from './DrawComponent';
import type { NorkartBasemapVariant } from './BasemapSelector';
import type { Address } from './SearchBar';

const TRONDHEIM_COORDS: [number, number] = [10.40565401, 63.4156575];

const KVP_BASE_URL = 'https://kvp.maps.norkart.no/mvt/';
const polygonStyle = {
  'fill-outline-color': 'rgba(0,0,0,0.1)',
  'fill-color': 'rgba(18, 94, 45, 0.41)',
};

export const MapLibreMap = ({ basemap, address, drawingRoadworks, onDrawingRoadworksChange, planningRoute, onPlanningRouteChange }: {
  basemap: NorkartBasemapVariant;
  address: Address | null;
  drawingRoadworks: boolean;
  onDrawingRoadworksChange: (value: boolean) => void;
  planningRoute: boolean;
  onPlanningRouteChange: (value: boolean) => void;
}) => {
  const [pointHoyde, setPointHoydeAtPunkt] = useState<number | undefined>(
    undefined
  );
  const [clickPoint, setClickPoint] = useState<LngLat | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);
  const [building, setBuilding] = useState<Bygning | undefined>(undefined);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const [pickingRoutePoint, setPickingRoutePoint] = useState(false);
  // Uten ruteplanleggeren: rute fra min posisjon til søkt adresse. Startpunktet låses når adressen velges
  // (eller når posisjonen blir kjent), så ruten ikke beregnes på nytt hver gang posisjonen flytter seg litt.
  const [autoStart, setAutoStart] = useState<[number, number] | null>(null);
  const myPositionRef = useRef(myPosition);
  myPositionRef.current = myPosition;
  const hasPosition = myPosition !== null;
  useEffect(() => {
    setAutoStart(address ? myPositionRef.current : null);
  }, [address, hasPosition]);
  const addressCoord: [number, number] | null = address ? [address.PayLoad.Posisjon.X, address.PayLoad.Posisjon.Y] : null;
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [bygningsOmriss, setBygningsOmriss] = useState<GeoJSON | undefined>(undefined);

  const onMapClick = async (e: MapLayerMouseEvent) => {
    if (drawingRoadworks || pickingRoutePoint) return;
    const currentRequest = ++requestId.current;
    setClickPoint(new LngLat(e.lngLat.lng, e.lngLat.lat));
    setPointHoydeAtPunkt(undefined);
    setBygningsOmriss(undefined);
    setBuilding(undefined);
    setBuildingLoading(true);
    setIsLoading(true);
    const buildingRequest = getBygningAtPunkt(e.lngLat.lng, e.lngLat.lat).then((bygning) => {
      if (currentRequest !== requestId.current) return;
      setBuilding(bygning);
      setBuildingLoading(false);
      const outline = bygning?.FkbData?.BygningsOmriss;
      if (!outline) return;
      try {
        const geometry: GeoJSON = JSON.parse(outline);
        setBygningsOmriss(geometry);
      } catch {
        console.error('Could not parse building outline.');
      }
    });
    const hoyder = await getHoydeFromPunkt(e.lngLat.lng, e.lngLat.lat);
    if (currentRequest !== requestId.current) return;
    const height = hoyder?.[0]?.Z;
    setPointHoydeAtPunkt(
      typeof height === 'number' && Number.isFinite(height) ? height : undefined
    );
    setIsLoading(false);
    await buildingRequest;
  };

  return (
    <RMap
      minZoom={6}
      initialCenter={TRONDHEIM_COORDS}
      initialZoom={12}
      mapStyle={`${KVP_BASE_URL}norkart-basemap/${basemap}/style.json`}
      initialTransformRequest={transformRequest}
      style={{
        height: `calc(100dvh - var(--header-height))`,
      }}
      onClick={onMapClick}
    >
      {bygningsOmriss && (
        <>
          <RSource id="bygning" type="geojson" data={bygningsOmriss} />
          <RLayer source="bygning" id="bygning-fill" type="fill" paint={polygonStyle} />
        </>
      )}
      {address && (
        <MapFlyTo lng={address.PayLoad.Posisjon.X} lat={address.PayLoad.Posisjon.Y} />
      )}
      {address && (
        <RMarker longitude={address.PayLoad.Posisjon.X} latitude={address.PayLoad.Posisjon.Y} initialColor="#1976d2" initialAnchor="bottom" />
      )}
      {clickPoint && (
        <RMarker
          longitude={clickPoint.lng}
          latitude={clickPoint.lat}
          initialColor="#e53935"
          initialAnchor="bottom"
          onClick={(event) => event.stopPropagation()}
        />
      )}
      <Overlay style={{ width: 310, maxWidth: '100%', boxSizing: 'border-box', padding: 18, background: 'linear-gradient(145deg, #edfff4, #dff5e9)', color: '#173e2c', border: '1px solid #bce7cd', borderTop: '5px solid #20bf78', boxShadow: '0 8px 28px rgba(17, 77, 47, 0.16)' }}>
        <section aria-labelledby="height-heading" aria-live="polite" style={{ minWidth: 0 }}>
          <h2 id="height-heading" style={{ margin: '0 0 10px', fontSize: 20 }}>Høyde i kartet</h2>
          {clickPoint ? (
            <>
              <p style={{ margin: '0 0 12px', padding: '10px 12px', background: '#ffffffa6', borderRadius: 12, fontSize: 18, fontWeight: 700 }}>
                {isLoading
                  ? 'Henter høyde …'
                  : pointHoyde !== undefined
                    ? `Høyde: ${pointHoyde.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} m`
                    : 'Kunne ikke hente høyde for dette punktet. Prøv et annet punkt.'}
              </p>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12 }}>
                <dt style={{ gridColumn: 1, gridRow: 1 }}>Breddegrad</dt>
                <dd style={{ margin: 0, gridColumn: 1, gridRow: 2, fontSize: 14, fontWeight: 600 }}>{clickPoint.lat.toFixed(6)}°</dd>
                <dt style={{ gridColumn: 2, gridRow: 1 }}>Lengdegrad</dt>
                <dd style={{ margin: 0, gridColumn: 2, gridRow: 2, fontSize: 14, fontWeight: 600 }}>{clickPoint.lng.toFixed(6)}°</dd>
              </dl>
            </>
          ) : (
            <p style={{ marginBottom: 0 }}>Klikk i kartet for å se høyde og koordinater.</p>
          )}
        </section>
        {clickPoint && <BuildingInfo building={building} loading={buildingLoading} />}
      </Overlay>
      <MyLocation onPositionChange={setMyPosition} />
      {planningRoute ? (
        <RoutePlanner myPosition={myPosition} onClose={() => onPlanningRouteChange(false)} onPickingChange={setPickingRoutePoint} />
      ) : (
        <Route
          points={autoStart && addressCoord ? [autoStart, addressCoord] : null}
          hint={address && !myPosition ? 'Trykk på «min posisjon»-knappen nede til høyre for å få kjørerute hit.' : null}
        />
      )}
      <Roadworks drawing={drawingRoadworks} onDrawingChange={onDrawingRoadworksChange} />
      {!drawingRoadworks && <DrawComponent />}
    </RMap>
  );
};

function MapFlyTo({ lng, lat }: { lng: number; lat: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo({ center: [lng, lat], zoom: 17, speed: 1.2 });
  }, [lng, lat, map]);

  return null;
}

const transformRequest: RequestTransformFunction = (url) => {
  if (!url.startsWith(KVP_BASE_URL)) {
    return { url };
  }

  const apiKey = import.meta.env.VITE_API_KEY;
  const separator = url.includes('?') ? '&' : '?';
  return { url: `${url}${separator}api_key=${encodeURIComponent(apiKey)}` };
};
