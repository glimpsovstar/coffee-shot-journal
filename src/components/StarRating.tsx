interface StarRatingProps {
  value: number;
  onChange?: (rating: 1 | 2 | 3 | 4 | 5) => void;
  name?: string;
  label?: string;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

export function StarRating({
  value,
  onChange,
  name = 'rating',
  label = 'Rating',
}: StarRatingProps) {
  const readOnly = onChange === undefined;

  if (readOnly) {
    return (
      <div className="star-rating" aria-label={`${value} out of 5 stars`}>
        {RATINGS.map((star) => (
          <span
            key={star}
            className={star <= value ? 'star star--filled' : 'star'}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <fieldset className="star-rating-field">
      <legend>{label}</legend>
      <div className="star-rating star-rating--input" role="radiogroup" aria-label={label}>
        {RATINGS.map((star) => (
          <label key={star} className="star-label">
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              required
            />
            <span className={star <= value ? 'star star--filled' : 'star'} aria-hidden="true">
              ★
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
