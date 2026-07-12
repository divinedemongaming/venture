-- Migration: Add ContentFingerprint table
-- Stores perceptual (dHash) fingerprints for every uploaded video/image
-- Used for exact and near-duplicate detection across the platform

CREATE TABLE "ContentFingerprint" (
    "id"          TEXT NOT NULL,
    "contentId"   TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "creatorId"   TEXT NOT NULL,
    "sha256"      TEXT NOT NULL,
    "frameHashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentFingerprint_contentId_key"  ON "ContentFingerprint"("contentId");
CREATE        INDEX "ContentFingerprint_creatorId_idx"  ON "ContentFingerprint"("creatorId");
CREATE        INDEX "ContentFingerprint_sha256_idx"     ON "ContentFingerprint"("sha256");
