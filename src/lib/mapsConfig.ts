/** Build Google Maps embed URL for café detail map. */
export function getGoogleMapsEmbedUrl(latitude: number, longitude: number): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (key?.trim()) {
    return `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key.trim())}&center=${latitude},${longitude}&zoom=16`;
  }
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
}

export function getGoogleMapsOpenUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
