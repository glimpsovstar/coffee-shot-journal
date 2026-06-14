import { getGoogleMapsEmbedUrl } from '../lib/mapsConfig';
import { CafeMapOpenLink } from './CafeMapOpenLink';

interface CafeMapEmbedProps {
  name: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  /** Shorter iframe for inline form preview. */
  preview?: boolean;
}

export function CafeMapEmbed({
  name,
  latitude,
  longitude,
  googlePlaceId,
  preview = false,
}: CafeMapEmbedProps) {
  const embedUrl = getGoogleMapsEmbedUrl(latitude, longitude);

  return (
    <div className={`cafe-map${preview ? ' cafe-map--preview' : ''}`}>
      <iframe
        title={`Map of ${name}`}
        className="cafe-map__iframe"
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <CafeMapOpenLink latitude={latitude} longitude={longitude} googlePlaceId={googlePlaceId} />
    </div>
  );
}
