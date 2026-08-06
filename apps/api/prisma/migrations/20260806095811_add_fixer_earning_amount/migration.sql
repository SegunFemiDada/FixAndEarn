-- 1. Add the column as nullable
ALTER TABLE "fixer_earnings"
ADD COLUMN "amountMilliFec" INTEGER;

-- 2. Backfill existing rows
UPDATE "fixer_earnings"
SET "amountMilliFec" =
    "availableMilliFec"
    +
    COALESCE(
      (
        SELECT SUM("amountMilliFec")
        FROM "withdrawal_allocations"
        WHERE "earningId" = "fixer_earnings"."id"
      ),
      0
    );

-- 3. Make it required
ALTER TABLE "fixer_earnings"
ALTER COLUMN "amountMilliFec" SET NOT NULL;