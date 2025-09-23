-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('HAIR_TREATMENTS', 'TWIST_HAIRSTYLE', 'CORNROWS_BRAIDS', 'STRAWSET_CURLS', 'STYLING_SERVICE', 'SPECIAL_OFFERS');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('SIXTH_VISIT', 'BIRTHDAY_MONTH', 'LOYALTY_POINTS', 'SERVICE_COMBO', 'BRING_OWN_PRODUCT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birthDay" INTEGER NOT NULL,
    "birthMonth" INTEGER NOT NULL,
    "birthYear" INTEGER,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastVisit" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."ServiceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "singlePrice" DECIMAL(10,2) NOT NULL,
    "combinedPrice" DECIMAL(10,2),
    "childPrice" DECIMAL(10,2),
    "childCombinedPrice" DECIMAL(10,2),
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isComboEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visits" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visit_services" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "isCombined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visit_staff" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discount_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "minAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visit_discounts" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "discountRuleId" TEXT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_discounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "discountRuleId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discountAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "customer_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "public"."customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "public"."services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "discount_rules_name_key" ON "public"."discount_rules"("name");

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_services" ADD CONSTRAINT "visit_services_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_services" ADD CONSTRAINT "visit_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_staff" ADD CONSTRAINT "visit_staff_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_staff" ADD CONSTRAINT "visit_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_discounts" ADD CONSTRAINT "visit_discounts_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_discounts" ADD CONSTRAINT "visit_discounts_discountRuleId_fkey" FOREIGN KEY ("discountRuleId") REFERENCES "public"."discount_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_discounts" ADD CONSTRAINT "customer_discounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_discounts" ADD CONSTRAINT "customer_discounts_discountRuleId_fkey" FOREIGN KEY ("discountRuleId") REFERENCES "public"."discount_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
