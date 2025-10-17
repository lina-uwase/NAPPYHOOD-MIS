-- AlterTable
ALTER TABLE "services" DROP COLUMN "duration";
ALTER TABLE "services" DROP COLUMN "isComboEligible";
ALTER TABLE "services" ALTER COLUMN "description" DROP NOT NULL;