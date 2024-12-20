/*
  Warnings:

  - The values [PENDING,PROCESSING,SUCCESS,FAILED] on the enum `WithdrawalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WithdrawalStatus_new" AS ENUM ('queued', 'processed', 'failed');
ALTER TABLE "Withdrawal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Withdrawal" ALTER COLUMN "status" TYPE "WithdrawalStatus_new" USING ("status"::text::"WithdrawalStatus_new");
ALTER TYPE "WithdrawalStatus" RENAME TO "WithdrawalStatus_old";
ALTER TYPE "WithdrawalStatus_new" RENAME TO "WithdrawalStatus";
DROP TYPE "WithdrawalStatus_old";
ALTER TABLE "Withdrawal" ALTER COLUMN "status" SET DEFAULT 'queued';
COMMIT;

-- AlterTable
ALTER TABLE "Withdrawal" ALTER COLUMN "status" SET DEFAULT 'queued';
