-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."visits" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
