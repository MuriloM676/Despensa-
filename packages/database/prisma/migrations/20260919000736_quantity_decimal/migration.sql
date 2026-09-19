/*
  Warnings:

  - You are about to alter the column `quantity` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.
  - You are about to alter the column `quantity` on the `ShoppingListItem` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ShoppingListItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);
