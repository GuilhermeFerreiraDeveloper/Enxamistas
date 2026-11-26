-- AlterTable
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "fileData" BYTEA;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RadioTrack_authorId_fkey'
  ) THEN
    ALTER TABLE "RadioTrack" ADD CONSTRAINT "RadioTrack_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE;
  END IF;
END $$;
