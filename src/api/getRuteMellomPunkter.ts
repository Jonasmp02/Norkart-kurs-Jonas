import type { LineString, MultiLineString } from 'geojson';

export const getRuteMellomPunkter = async (
  startX: number,
  startY: number,
  stoppX: number,
  stoppY: number,
  via: [number, number][] = []
) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://ruteberegner.api.norkart.no/Route/Expanded`;

  const postData = {
    Start: {
      X: startX,
      Y: startY,
      FeatureSnapRestriction: ['Road', 'Motorway'],
    },
    Stop: {
      X: stoppX,
      Y: stoppY,
      FeatureSnapRestriction: ['Road', 'Motorway'],
    },
    ViaPoints: via.map(([x, y]) => ({ X: x, Y: y, FeatureSnapRestriction: ['Road', 'Motorway'] })),
    SrsId: 4326,
    GraphName: 'ta-norden-dynamic',
    CostFunction: 'time',
    RouteFeatures: [
      'TerminalInfo',
      'JunctionInfo',
      'RoundaboutInfo',
      'RoadInfo',
      'UTurnInfo',
      'FerryInfo',
      'TollInfo',
    ],
    ZoomLevel: 14,
  };

  try {
    const apiResult = await fetch(query, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-WAAPI-TOKEN': `${apiKey}`,
      },
      body: JSON.stringify(postData),
    });

    if (!apiResult.ok) {
      console.error('API request failed with status:', apiResult.status);
      return undefined;
    }
    const data = await apiResult.json();
    const geometry: MultiLineString | LineString | undefined =
      typeof data.RouteGeometry === 'string' ? JSON.parse(data.RouteGeometry) : data.RouteGeometry;
    if (!geometry?.coordinates?.length) return undefined;
    return { geometry, costs: Array.isArray(data.CostList) ? data.CostList : [] } as Rute;
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return undefined;
  }
};

export type Rute = {
  geometry: MultiLineString | LineString;
  costs: Record<string, unknown>[];
};
