import type { ShotWeather } from '../types';
import {
  resolveWeatherCode,
  weatherIconVariant,
  type WeatherIconVariant,
} from '../utils/weatherCodes';

interface WeatherDisplayProps {
  weather: ShotWeather;
}

function WeatherIcon({ variant }: { variant: WeatherIconVariant }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (variant) {
    case 'clear':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'partly-cloudy':
      return (
        <svg {...props}>
          <path d="M12 3v2M16.24 5.76l-1.41 1.41M18 12h2M7.76 7.76 6.34 6.34M4 12H2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 8.5 4.5 4.5 0 0 0 7 18z" />
        </svg>
      );
    case 'fog':
      return (
        <svg {...props}>
          <path d="M4 14h16M4 18h16M6 10h12a4 4 0 0 0 .4-7.98A5.5 5.5 0 0 0 4.5 6.5 4.5 4.5 0 0 0 4 10z" />
        </svg>
      );
    case 'drizzle':
      return (
        <svg {...props}>
          <path d="M7 16h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 8.5 4.5 4.5 0 0 0 7 16z" />
          <path d="M8 20v.01M12 20v.01M16 20v.01" />
        </svg>
      );
    case 'rain':
    case 'rain-showers':
      return (
        <svg {...props}>
          <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 6.5 4.5 4.5 0 0 0 7 14z" />
          <path d="M8 18v2M12 18v2M16 18v2" />
        </svg>
      );
    case 'snow':
    case 'snow-showers':
      return (
        <svg {...props}>
          <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 6.5 4.5 4.5 0 0 0 7 14z" />
          <path d="M8 18h.01M12 18h.01M16 18h.01M10 20h.01M14 20h.01" />
        </svg>
      );
    case 'thunderstorm':
      return (
        <svg {...props}>
          <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 6.5 4.5 4.5 0 0 0 7 14z" />
          <path d="M13 16l-2 4h3l-2 4" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M7 16h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 8.5 4.5 4.5 0 0 0 7 16z" />
        </svg>
      );
  }
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const code = resolveWeatherCode(weather);
  const variant = weatherIconVariant(code);
  const label = `${weather.temperatureC}°C, ${weather.humidityPercent}% humidity, ${weather.description}`;

  return (
    <div className="weather-display" aria-label={label}>
      <span className="weather-display__primary">
        <WeatherIcon variant={variant} />
        <span className="weather-display__temp">{weather.temperatureC}°C</span>
      </span>
      <span className="weather-display__details">
        {weather.humidityPercent}% humidity · {weather.description}
      </span>
    </div>
  );
}
