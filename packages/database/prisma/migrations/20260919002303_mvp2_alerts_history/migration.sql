-- CreateEnum
CREATE TYPE "StockEventKind" AS ENUM ('PURCHASE', 'CONSUME', 'REMOVE');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "alertWindowDays" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "minStockLevel" DECIMAL(10,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StockEvent" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "StockEventKind" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockEvent_householdId_createdAt_idx" ON "StockEvent"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "StockEvent_householdId_productId_createdAt_idx" ON "StockEvent"("householdId", "productId", "createdAt");

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
