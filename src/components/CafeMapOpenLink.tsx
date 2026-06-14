import { getGoogleMapsPlaceOpenUrl } from '../lib/mapsConfig';

interface CafeMapOpenLinkProps {
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  className?: string;
}

export function CafeMapOpenLink({
  latitude,
  longitude,
  googlePlaceId,
  className = 'cafe-map__link',
}: CafeMapOpenLinkProps) {
  const href = getGoogleMapsPlaceOpenUrl({ latitude, longitude, googlePlaceId });

  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      Open in Google Maps
    </a>
  );
}
