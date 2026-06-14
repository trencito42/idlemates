-- AlterTable: add optional discount columns to Plan
ALTER TABLE `Plan`
  ADD COLUMN `discountAmount` INTEGER NULL,
  ADD COLUMN `discountUntil` DATETIME NULL;
