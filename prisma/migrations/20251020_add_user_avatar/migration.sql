-- Add avatarUrl column to User
ALTER TABLE `User`
  ADD COLUMN `avatarUrl` VARCHAR(191) NULL;
