-- Flatten leaf folders: convert leaf folders with jobs into jobs in parent folder

-- Step 1: Update jobs in leaf folders to use the leaf folder's name and move to parent folder
UPDATE "Job" j
SET
  "name" = f."name",
  "folderId" = f."parentId"
FROM "Folder" f
WHERE j."folderId" = f."id"
  AND f."parentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Folder" child WHERE child."parentId" = f."id");

-- Step 2: Delete the now-empty leaf folders (those that had jobs moved out)
DELETE FROM "Folder" f
WHERE f."parentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Folder" child WHERE child."parentId" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "Job" j WHERE j."folderId" = f."id");
