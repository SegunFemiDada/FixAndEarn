-- Rebuild cached fixer rating aggregates from JobReview,
-- which is the source of truth for ratings.

UPDATE users AS u
SET
  "averageRating" = COALESCE(
    aggregates.average_rating,
    0
  ),
  "totalRatings" = COALESCE(
    aggregates.total_ratings,
    0
  )
FROM (
  SELECT
    "fixerId",
    AVG(rating)::double precision AS average_rating,
    COUNT(*)::integer AS total_ratings
  FROM "JobReview"
  GROUP BY "fixerId"
) AS aggregates
WHERE u.id = aggregates."fixerId";

-- Reset cached aggregates for users who currently have
-- no JobReview records.
UPDATE users AS u
SET
  "averageRating" = 0,
  "totalRatings" = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "JobReview" AS r
  WHERE r."fixerId" = u.id
);