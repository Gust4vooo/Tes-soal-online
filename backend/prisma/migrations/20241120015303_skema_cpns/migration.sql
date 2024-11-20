-- AlterTable
ALTER TABLE "Multiplechoice" ADD COLUMN     "isWeighted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "points" INTEGER,
ALTER COLUMN "isCorrect" DROP NOT NULL;

-- DropEnum
DROP TYPE "OptionLabel";
