import { useEffect, useId, useRef, useState } from 'react';
import { isGooglePlacesEnabled } from '../lib/mapsConfig';
import {
  autocompleteCafePlaces,
  getCafePlaceDetails,
  type CafePlaceSuggestion,
} from '../services/googlePlaces';

interface CafePlaceFieldProps {
  name: string;
  address: string;
  photoSuggestions: CafePlaceSuggestion[];
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSelectPlace: (place: CafePlaceSuggestion | null) => void;
}

export function CafePlaceField({
  name,
  address,
  photoSuggestions,
  onNameChange,
  onAddressChange,
  onSelectPlace,
}: CafePlaceFieldProps) {
  const nameId = useId();
  const listId = `${nameId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<CafePlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placesEnabled = isGooglePlacesEnabled();
  const suggestions = searchResults;

  useEffect(() => {
    if (!placesEnabled || name.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await autocompleteCafePlaces(name);
        setSearchResults(results);
        if (results.length === 0) {
          setSearchError('No matches — try suburb or street in the name, or enter address manually.');
        }
      } catch (err) {
        setSearchResults([]);
        const message = err instanceof Error ? err.message : 'Places search failed.';
        setSearchError(
          message.includes('403') || message.includes('PERMISSION_DENIED')
            ? 'Google Places blocked this site — check API key referrer restrictions for your Vercel URL.'
            : 'Could not reach Google Places — check API key and that Places API (New) is enabled.',
        );
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [name, placesEnabled]);

  const applyPlace = async (place: CafePlaceSuggestion) => {
    onNameChange(place.name);
    onAddressChange(place.address);
    setSearchError(null);
    if (place.latitude !== undefined && place.longitude !== undefined) {
      onSelectPlace(place);
      setOpen(false);
      return;
    }
    const details = await getCafePlaceDetails(place.placeId);
    if (details) {
      onNameChange(details.name);
      onAddressChange(details.address);
      onSelectPlace(details);
    } else {
      onSelectPlace(place);
    }
    setOpen(false);
  };

  return (
    <div className="cafe-place-field">
      <div className="form-row suburb-autocomplete">
        <label htmlFor={nameId}>Name</label>
        <input
          id={nameId}
          type="text"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && suggestions[activeIndex]
              ? `${nameId}-option-${activeIndex}`
              : undefined
          }
          value={name}
          onChange={(e) => {
            onNameChange(e.target.value);
            onSelectPlace(null);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && suggestions[activeIndex]) {
              e.preventDefault();
              applyPlace(suggestions[activeIndex]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Start typing a café name"
          required
        />
        {placesEnabled && searching ? (
          <p className="photo-upload__hint">Searching Google Maps…</p>
        ) : null}
        {!placesEnabled ? (
          <p className="photo-upload__hint">
            Add <code>VITE_GOOGLE_MAPS_API_KEY</code> for name autocomplete, or enter address manually.
          </p>
        ) : null}
        {open && suggestions.length > 0 ? (
          <ul id={listId} className="suburb-autocomplete__list" role="listbox">
            {suggestions.map((place, index) => (
              <li key={place.placeId} role="presentation">
                <button
                  type="button"
                  id={`${nameId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex ? 'suburb-autocomplete__option--active' : undefined
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyPlace(place)}
                >
                  <span className="cafe-place-field__suggestion-name">{place.name}</span>
                  {place.address ? (
                    <span className="cafe-place-field__suggestion-address">{place.address}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {searchError && !searching ? (
          <p className="photo-upload__hint" role="status">{searchError}</p>
        ) : null}
      </div>

      <div className="form-row">
        <label htmlFor={`${nameId}-address`}>Address</label>
        <input
          id={`${nameId}-address`}
          type="text"
          value={address}
          onChange={(e) => {
            onAddressChange(e.target.value);
            onSelectPlace(null);
          }}
          placeholder="Filled when you pick a Google suggestion, or type manually"
        />
      </div>

      {photoSuggestions.length > 0 ? (
        <div className="cafe-place-field__photo-suggestions">
          <p className="photo-upload__hint">Suggested from photo location:</p>
          <ul className="cafe-place-field__photo-list">
            {photoSuggestions.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  className="btn-ghost cafe-place-field__photo-btn"
                  onClick={() => applyPlace(place)}
                >
                  <span>{place.name}</span>
                  {place.address ? (
                    <span className="cafe-place-field__suggestion-address">{place.address}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
