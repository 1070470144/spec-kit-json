-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "authorName" TEXT,
    "summary" TEXT,
    "tagsCsv" TEXT,
    "language" TEXT,
    "license" TEXT,
    "sourceLink" TEXT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "coverImageId" TEXT,
    "createdById" TEXT,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "systemOwned" BOOLEAN NOT NULL DEFAULT false,
    "originalOwnerId" TEXT,
    "transferredAt" DATETIME,
    CONSTRAINT "Script_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Script_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Script" ("authorId", "authorName", "coverImageId", "createdAt", "createdById", "id", "language", "license", "publishedAt", "sourceLink", "state", "summary", "tagsCsv", "title", "updatedAt") SELECT "authorId", "authorName", "coverImageId", "createdAt", "createdById", "id", "language", "license", "publishedAt", "sourceLink", "state", "summary", "tagsCsv", "title", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
