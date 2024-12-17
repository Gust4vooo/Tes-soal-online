/*
  Warnings:

  - Added the required column `pageName` to the `Multiplechoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Type" AS ENUM ('PilihanGanda', 'Essay');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Multiplechoice" ADD COLUMN     "pageName" TEXT NOT NULL,
ALTER COLUMN "questionPhoto" DROP NOT NULL,
ALTER COLUMN "weight" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "type" "Type" NOT NULL;

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
