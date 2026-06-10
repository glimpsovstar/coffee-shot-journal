import { getGoogleMapsApiKey, isGooglePlacesEnabled } from '../lib/mapsConfig';

export interface CafePlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

const PLACES_BASE = 'https://places.googleapis.com/v1';

function apiKey(): string {
  const key = getGoogleMapsApiKey();
  if (!key) throw new Error('Google Maps API key is not configured.');
  return key;
}

function parsePlaceResourceId(place: string): string {
  return place.startsWith('places/') ? place.slice('places/'.length) : place;
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
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
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

/** Autocomplete café / coffee shop names (requires Places API on the Maps key). */
export async function autocompleteCafePlaces(input: string): Promise<CafePlaceSuggestion[]> {
  if (!isGooglePlacesEnabled()) return [];
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  const data = await placesFetch<AutocompleteResponse>('/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
    },
    body: JSON.stringify({
      input: trimmed,
      includedPrimaryTypes: ['cafe', 'coffee_shop'],
      languageCode: 'en',
    }),
  });

  return (data.suggestions ?? [])
    .map((item) => {
      const prediction = item.placePrediction;
      if (!prediction?.placeId) return null;
      const name =
        prediction.structuredFormat?.mainText?.text?.trim() ??
        prediction.text?.text?.trim() ??
        '';
      if (!name) return null;
      const address = prediction.structuredFormat?.secondaryText?.text?.trim() ?? '';
      return {
        placeId: prediction.placeId,
        name,
        address,
      };
    })
    .filter((item): item is CafePlaceSuggestion => item !== null);
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
      includedTypes: ['cafe', 'coffee_shop'],
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 200,
        },
      },
    }),
  });

  return (data.places ?? [])
    .map((place) => mapPlaceDetails(place))
    .filter((item): item is CafePlaceSuggestion => item !== null);
}
