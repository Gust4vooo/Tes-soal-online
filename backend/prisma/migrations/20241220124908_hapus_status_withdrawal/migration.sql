/*
  Warnings:

  - You are about to drop the column `status` on the `Withdrawal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "status";

-- DropEnum
DROP TYPE "WithdrawalStatus";
