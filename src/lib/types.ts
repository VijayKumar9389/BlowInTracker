import type { Job, Location, JobStatus } from "@prisma/client";

export type { Job, Location, JobStatus };

export type LocationWithRelations = Location & {
  children: LocationWithRelations[];
  jobs: Job[];
};

export type FilterType = "todo" | "complete" | "all";
