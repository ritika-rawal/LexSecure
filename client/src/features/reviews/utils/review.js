import {
  REVIEW_COMMENT_MAXIMUM_LENGTH,
  REVIEW_COMMENT_MINIMUM_LENGTH,
  REVIEW_RATING_MAXIMUM,
  REVIEW_RATING_MINIMUM,
} from '../constants/review.js';

const UNSAFE_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export const validateReview = ({ rating, comment }) => {
  if (
    !Number.isInteger(rating)
    || rating < REVIEW_RATING_MINIMUM
    || rating > REVIEW_RATING_MAXIMUM
  ) {
    return 'Choose a rating between 1 and 5 stars.';
  }

  const normalizedComment = comment.trim();

  if (
    normalizedComment
    && (
      normalizedComment.length < REVIEW_COMMENT_MINIMUM_LENGTH
      || normalizedComment.length > REVIEW_COMMENT_MAXIMUM_LENGTH
    )
  ) {
    return `Comment must be between ${REVIEW_COMMENT_MINIMUM_LENGTH} and `
      + `${REVIEW_COMMENT_MAXIMUM_LENGTH} characters, or left empty.`;
  }

  if (UNSAFE_CONTROL_CHARACTER_PATTERN.test(normalizedComment)) {
    return 'Comment contains unsupported control characters.';
  }

  return '';
};

export const formatReviewDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
