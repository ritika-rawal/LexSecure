import { Star } from 'lucide-react';

import {
  REVIEW_RATING_MAXIMUM,
  REVIEW_RATING_MINIMUM,
} from '../constants/review.js';

const RATINGS = Object.freeze(
  Array.from(
    {
      length: REVIEW_RATING_MAXIMUM - REVIEW_RATING_MINIMUM + 1,
    },
    (_, index) => index + REVIEW_RATING_MINIMUM,
  ),
);

const StarRating = ({
  interactive = false,
  onChange,
  rating,
  size = 'h-5 w-5',
}) => (
  <div
    aria-label={interactive ? 'Review rating' : `${rating} out of 5 stars`}
    className="flex items-center gap-1"
    role={interactive ? 'group' : 'img'}
  >
    {RATINGS.map((value) => {
      const selected = value <= rating;
      const Icon = (
        <Star
          aria-hidden="true"
          className={`${size} ${selected ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
        />
      );

      return interactive ? (
        <button
          aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
          aria-pressed={rating === value}
          className="grid h-10 w-10 place-items-center hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-forest"
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          {Icon}
        </button>
      ) : (
        <span key={value}>{Icon}</span>
      );
    })}
  </div>
);

export default StarRating;
