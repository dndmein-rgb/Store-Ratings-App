import './StarRating.css';

// value: current rating (number or null)
// onRate: optional callback, if provided the stars become clickable
// size: 'sm' | 'md'
export default function StarRating({ value, onRate, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onRate === 'function';

  return (
    <span className={`star-rating star-rating--${size}`}>
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${value && s <= value ? 'star--filled' : ''} ${interactive ? 'star--clickable' : ''}`}
          onClick={interactive ? () => onRate(s) : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${s} star` : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
