-- Add name column to Job table
ALTER TABLE "Job" ADD COLUMN "name" TEXT;

-- Backfill existing jobs with their folder's name
UPDATE "Job" j SET "name" = f."name" FROM "Folder" f WHERE j."folderId" = f."id";

-- Make the column required
ALTER TABLE "Job" ALTER COLUMN "name" SET NOT NULL;
