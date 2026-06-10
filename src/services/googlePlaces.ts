import { getGoogleMapsApiKey, isGooglePlacesEnabled } from '../lib/mapsConfig';

export interface CafePlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

const PLACES_BASE = 'https://places.googleapis.com/v1';

/** AU/NZ bias for café search — app focus region. */
const REGION_CODES = ['au', 'nz'];

function apiKey(): string {
  const key = getGoogleMapsApiKey();
  if (!key) throw new Error('Google Maps API key is not configured.');
  return key;
}

function parsePlaceResourceId(place: string): string {
  return place.startsWith('places/') ? place.slice('places/'.length) : place;
}

function resolvePlaceId(placeId?: string, placeResource?: string): string | undefined {
  if (placeId?.trim()) return placeId.trim();
  if (placeResource?.trim()) return parsePlaceResourceId(placeResource.trim());
  return undefined;
}

async function placesFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PLACES_BASE}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Places API error (${response.status})`);
  }
  return response.json() as Promise<T>;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      place?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
}

interface PlaceDetailsResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
}

interface NearbySearchResponse {
  places?: PlaceDetailsResponse[];
}

function mapPlaceDetails(data: PlaceDetailsResponse): CafePlaceSuggestion | null {
  if (!data.id) return null;
  const placeId = parsePlaceResourceId(data.id);
  const name = data.displayName?.text?.trim();
  if (!name) return null;
  return {
    placeId,
    name,
    address: data.formattedAddress?.trim() ?? '',
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
  };
}

function mapAutocompletePrediction(
  prediction: NonNullable<AutocompleteResponse['suggestions']>[number]['placePrediction'],
): CafePlaceSuggestion | null {
  if (!prediction) return null;
  const placeId = resolvePlaceId(prediction.placeId, prediction.place);
  if (!placeId) return null;
  const name =
    prediction.structuredFormat?.mainText?.text?.trim() ??
    prediction.text?.text?.trim() ??
    '';
  if (!name) return null;
  const address = prediction.structuredFormat?.secondaryText?.text?.trim() ?? '';
  return { placeId, name, address };
}

async function autocompletePlaces(input: string): Promise<CafePlaceSuggestion[]> {
  const data = await placesFetch<AutocompleteResponse>('/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: REGION_CODES,
      languageCode: 'en',
    }),
  });

  return (data.suggestions ?? [])
    .map((item) => mapAutocompletePrediction(item.placePrediction))
    .filter((item): item is CafePlaceSuggestion => item !== null);
}

/** Text search fallback when autocomplete returns no place predictions. */
async function searchTextPlaces(query: string): Promise<CafePlaceSuggestion[]> {
  const data = await placesFetch<NearbySearchResponse>('/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 5,
      languageCode: 'en',
      regionCode: 'nz',
    }),
  });

  return (data.places ?? [])
    .map((place) => mapPlaceDetails(place))
    .filter((item): item is CafePlaceSuggestion => item !== null);
}

/** Autocomplete café / coffee shop names (requires Places API on the Maps key). */
export async function autocompleteCafePlaces(input: string): Promise<CafePlaceSuggestion[]> {
  if (!isGooglePlacesEnabled()) return [];
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  const autocomplete = await autocompletePlaces(trimmed);
  if (autocomplete.length > 0) return autocomplete;

  return searchTextPlaces(trimmed);
}

/** Resolve a place id to coordinates and formatted address. */
export async function getCafePlaceDetails(placeId: string): Promise<CafePlaceSuggestion | null> {
  if (!isGooglePlacesEnabled()) return null;
  const id = parsePlaceResourceId(placeId);

  const data = await placesFetch<PlaceDetailsResponse>(`/places/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });

  return mapPlaceDetails(data);
}

/** Find cafés near photo GPS (for EXIF location hints). */
export async function searchCafesNearLocation(
  latitude: number,
  longitude: number,
): Promise<CafePlaceSuggestion[]> {
  if (!isGooglePlacesEnabled()) return [];

  const data = await placesFetch<NearbySearchResponse>('/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      includedTypes: ['cafe', 'coffee_shop', 'restaurant'],
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 300,
        },
      },
    }),
  });

  const nearby = (data.places ?? [])
    .map((place) => mapPlaceDetails(place))
    .filter((item): item is CafePlaceSuggestion => item !== null);

  if (nearby.length > 0) return nearby;

  const label = await reverseGeocodeLabel(latitude, longitude);
  if (!label) return [];

  return searchTextPlaces(`${label} cafe`);
}

async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { results?: Array<{ name?: string }> };
  return data.results?.[0]?.name?.trim() ?? null;
}
