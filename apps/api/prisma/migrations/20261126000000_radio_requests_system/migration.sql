-- Converter o sistema antigo de rádio para pedidos de música.

ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "passport" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "referenceUrl" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "filePath" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
ALTER TABLE "RadioTrack" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "RadioTrack"
SET "status" = CASE
  WHEN "status" = 'PENDING' THEN 'SOLICITADA'
  WHEN "status" = 'APPROVED' THEN 'ADICIONADA_PLAYLIST'
  WHEN "status" = 'REJECTED' THEN 'RECUSADA'
  ELSE 'SOLICITADA'
END
WHERE "status" IS NULL OR "status" NOT IN ('SOLICITADA', 'EM_ANALISE', 'ADICIONADA_PLAYLIST', 'RECUSADA');

ALTER TABLE "RadioTrack" ALTER COLUMN "status" SET DEFAULT 'SOLICITADA';

UPDATE "RadioTrack" rt
SET "passport" = u."passport"
FROM "Profile" p
JOIN "User" u ON u."id" = p."userId"
WHERE rt."authorId" = p."id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "RadioTrack" rt
    WHERE rt."authorId" IS NULL
       OR rt."passport" IS NULL
       OR NOT EXISTS (SELECT 1 FROM "Profile" p WHERE p."id" = rt."authorId")
  ) THEN
    RAISE EXCEPTION 'Pedidos de rádio possuem autor/passaporte inválido; corrija os dados antes da migração.';
  END IF;
END $$;

ALTER TABLE "RadioTrack" ALTER COLUMN "passport" SET NOT NULL;
ALTER TABLE "RadioTrack" ALTER COLUMN "authorId" SET NOT NULL;
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "url";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "coverUrl";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "duration";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "sourceType";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "youtubeId";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "youtubeUrl";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "mimeType";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "fileSize";
ALTER TABLE "RadioTrack" DROP COLUMN IF EXISTS "fileData";

ALTER TABLE "RadioPlaylist" ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "RadioPlaylist" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO "RadioPlaylist" ("id", "name", "description", "profileId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT,
       'Playlist de ' || u."passport",
       'Playlist individual do membro ' || u."passport",
       p."id",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "authorId" FROM "RadioTrack" WHERE "authorId" IS NOT NULL) rt
JOIN "Profile" p ON p."id" = rt."authorId"
JOIN "User" u ON u."id" = p."userId"
WHERE NOT EXISTS (
  SELECT 1 FROM "RadioPlaylist" rp WHERE rp."profileId" = p."id"
);

UPDATE "RadioPlaylistTrack" rpt
SET "playlistId" = rp."id"
FROM "RadioTrack" rt
JOIN "RadioPlaylist" rp ON rp."profileId" = rt."authorId"
WHERE rpt."trackId" = rt."id";

DELETE FROM "RadioPlaylistTrack"
WHERE "trackId" IN (
  SELECT rt."id" FROM "RadioTrack" rt
  WHERE rt."status" <> 'ADICIONADA_PLAYLIST'
);

DELETE FROM "RadioPlaylist" WHERE "profileId" IS NULL;
ALTER TABLE "RadioPlaylist" ALTER COLUMN "profileId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "RadioPlaylist_profileId_key" ON "RadioPlaylist"("profileId");
CREATE UNIQUE INDEX IF NOT EXISTS "RadioPlaylistTrack_playlistId_trackId_key" ON "RadioPlaylistTrack"("playlistId", "trackId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RadioTrack_authorId_fkey') THEN
    ALTER TABLE "RadioTrack" ADD CONSTRAINT "RadioTrack_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RadioTrack_reviewedById_fkey') THEN
    ALTER TABLE "RadioTrack" ADD CONSTRAINT "RadioTrack_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "Profile"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RadioPlaylist_profileId_fkey') THEN
    ALTER TABLE "RadioPlaylist" ADD CONSTRAINT "RadioPlaylist_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE;
  END IF;
END $$;
