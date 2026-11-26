-- AlterTable
ALTER TABLE "RadioTrack" ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'AUDIO',
ALTER COLUMN "url" DROP NOT NULL,
ADD COLUMN     "youtubeId" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;