-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_multiplechoiceId_fkey";

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_multiplechoiceId_fkey" FOREIGN KEY ("multiplechoiceId") REFERENCES "Multiplechoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
