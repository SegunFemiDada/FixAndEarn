-- Rebuild cached fixer rating aggregates from job_reviews.
-- job_reviews is the source of truth for ratings.

-- First reset cached aggregates for every user.
UPDATE users
SET
  "averageRating" = 0,
  "totalRatings" = 0;

-- Then rebuild the cached aggregates from actual reviews.
UPDATE users AS u
SET
  "averageRating" = aggregates.average_rating,
  "totalRatings" = aggregates.total_ratings
FROM (
  SELECT
    "fixerId",
    AVG(rating)::double precision AS average_rating,
    COUNT(*)::integer AS total_ratings
  FROM job_reviews
  GROUP BY "fixerId"
) AS aggregates
WHERE u.id = aggregates."fixerId";
