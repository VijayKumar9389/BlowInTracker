import type { Job, Folder, JobStatus } from "@prisma/client";

export type { Job, Folder, JobStatus };

export type FolderWithRelations = Folder & {
  children: FolderWithRelations[];
  jobs: Job[];
};

export type FilterType = "all" | "waiting" | "ready" | "in_progress" | "complete";
