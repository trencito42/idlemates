-- Add authorId column to NewsPost and FK to User
ALTER TABLE `NewsPost`
  ADD COLUMN `authorId` VARCHAR(191) NULL;

ALTER TABLE `NewsPost`
  ADD CONSTRAINT `NewsPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
