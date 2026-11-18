-- Rename Location table to Folder
ALTER TABLE "Location" RENAME TO "Folder";

-- Rename locationId column to folderId in Job table
ALTER TABLE "Job" RENAME COLUMN "locationId" TO "folderId";

-- Rename the index
ALTER INDEX "Location_parentId_idx" RENAME TO "Folder_parentId_idx";
ALTER INDEX "Job_locationId_idx" RENAME TO "Job_folderId_idx";
