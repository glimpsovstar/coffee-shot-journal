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

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return key?.trim() || undefined;
}

export function isGooglePlacesEnabled(): boolean {
  return Boolean(getGoogleMapsApiKey());
}
