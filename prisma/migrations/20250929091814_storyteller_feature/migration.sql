/*
  Warnings:

  - Made the column `id` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Favorite` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `LikeEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ScriptJSON_contentHash_key";

-- CreateTable
CREATE TABLE "StorytellerApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "StorytellerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Like_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "content", "createdAt", "id", "scriptId") SELECT "authorId", "content", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "id", "scriptId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Favorite_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Favorite" ("createdAt", "id", "scriptId", "userId") SELECT coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "id", "scriptId", "userId" FROM "Favorite";
DROP TABLE "Favorite";
ALTER TABLE "new_Favorite" RENAME TO "Favorite";
CREATE UNIQUE INDEX "Favorite_userId_scriptId_key" ON "Favorite"("userId", "scriptId");
CREATE TABLE "new_LikeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LikeEvent_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LikeEvent" ("actorId", "createdAt", "id", "scriptId") SELECT "actorId", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "id", "scriptId" FROM "LikeEvent";
DROP TABLE "LikeEvent";
ALTER TABLE "new_LikeEvent" RENAME TO "LikeEvent";
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
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Script_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Script" ("authorId", "authorName", "coverImageId", "createdAt", "id", "language", "license", "publishedAt", "sourceLink", "state", "summary", "tagsCsv", "title", "updatedAt") SELECT "authorId", "authorName", "coverImageId", "createdAt", "id", "language", "license", "publishedAt", "sourceLink", "state", "summary", "tagsCsv", "title", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nickname" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "storytellerLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "avatarUrl" TEXT
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "emailVerifiedAt", "id", "lastLoginAt", "nickname", "passwordHash", "status", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "emailVerifiedAt", "id", "lastLoginAt", "nickname", "passwordHash", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_scriptId_key" ON "Like"("userId", "scriptId");
