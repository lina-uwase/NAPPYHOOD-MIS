-- Force remove duration column if it still exists
ALTER TABLE "services" DROP COLUMN IF EXISTS "duration";
ALTER TABLE "services" DROP COLUMN IF EXISTS "isComboEligible";