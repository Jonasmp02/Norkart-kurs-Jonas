export type Bygning = {
  Bygningsnummer?: number;
  MatrikkelData?: {
    Bygningsnummer?: number;
    Bygningstype?: string;
    Bygningstatus?: string;
    Naringsgruppe?: string;
    AntattByggeaar?: number;
    HarSefrakminne?: boolean;
    HarKulturminne?: boolean;
  } | null;
  FkbData?: { BygningsOmriss?: string | null } | null;
};

export const getBygningAtPunkt = async (x: number, y: number): Promise<Bygning | undefined> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://bygning.api.norkart.no/bygninger/byposition?x=${x}&y=${y}&MaxRadius=1&GeometryTextFormat=GeoJson&IncludeFkbData=true`;

  try {
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-WAAPI-TOKEN': apiKey,
      },
    });
    if (!response.ok) {
      console.error('Building API request failed with status:', response.status);
      return undefined;
    }
    const data = await response.json();
    return data.Bygninger?.[0];
  } catch {
    console.error('Could not fetch building data.');
    return undefined;
  }
};
