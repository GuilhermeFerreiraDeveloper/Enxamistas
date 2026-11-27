CREATE TABLE "GalleryPhoto" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryPhoto_createdAt_id_idx" ON "GalleryPhoto"("createdAt", "id");

ALTER TABLE "GalleryPhoto"
ADD CONSTRAINT "GalleryPhoto_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
