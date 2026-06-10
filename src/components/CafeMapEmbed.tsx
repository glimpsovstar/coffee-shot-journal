import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from '../lib/mapsConfig';

interface CafeMapEmbedProps {
  name: string;
  latitude: number;
  longitude: number;
}

export function CafeMapEmbed({ name, latitude, longitude }: CafeMapEmbedProps) {
  const embedUrl = getGoogleMapsEmbedUrl(latitude, longitude);
  const openUrl = getGoogleMapsOpenUrl(latitude, longitude);

  return (
    <div className="cafe-map">
      <iframe
        title={`Map of ${name}`}
        className="cafe-map__iframe"
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a className="cafe-map__link" href={openUrl} target="_blank" rel="noopener noreferrer">
        Open in Google Maps
      </a>
    </div>
  );
}
