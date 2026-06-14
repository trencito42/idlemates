-- AlterTable
ALTER TABLE `SteamAccount` 
  MODIFY `sharedSecretEnc` TEXT NULL,
  MODIFY `refreshTokenEnc` TEXT NULL;
