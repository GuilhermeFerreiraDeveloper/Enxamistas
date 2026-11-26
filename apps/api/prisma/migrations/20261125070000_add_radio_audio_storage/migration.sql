-- AlterTable
ALTER TABLE "RadioTrack" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "authorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RadioTrack" ADD CONSTRAINT "RadioTrack_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE;
