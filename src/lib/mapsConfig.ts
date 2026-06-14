/** Build Google Maps embed URL for café detail map. */
export function getGoogleMapsEmbedUrl(latitude: number, longitude: number): string {
  const key = getGoogleMapsApiKey();
  if (key) {
    return `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key)}&center=${latitude},${longitude}&zoom=16`;
  }
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
}

export function getGoogleMapsOpenUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Open the place in Google Maps (app or web). Prefers place id when available. */
export function getGoogleMapsPlaceOpenUrl(options: {
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
}): string {
  const placeId = options.googlePlaceId?.trim();
  if (placeId) {
    const params = new URLSearchParams({ api: '1', query_place_id: placeId });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }
  return getGoogleMapsOpenUrl(options.latitude, options.longitude);
}

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return key?.trim() || undefined;
}

export function isGooglePlacesEnabled(): boolean {
  return Boolean(getGoogleMapsApiKey());
}
