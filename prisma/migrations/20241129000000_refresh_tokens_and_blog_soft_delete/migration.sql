-- Add soft-delete column to Blog
ALTER TABLE "Blog" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create RefreshToken table
CREATE TABLE "RefreshToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on tokenHash so lookups are O(1) and collisions are impossible
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- Index for fast per-user token lookups (e.g. revoking all sessions)
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- Foreign key: deleting a user cascades to their refresh tokens
ALTER TABLE "RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
