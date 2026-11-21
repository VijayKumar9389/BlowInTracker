import { prisma } from "@/lib/db";
import { JobsPageClient } from "./client";
import type { FolderWithRelations, FilterType } from "@/lib/types";
import type { Job } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getFoldersWithJobs(): Promise<FolderWithRelations[]> {
  const folders = await prisma.folder.findMany({
    where: { parentId: null },
    include: {
      jobs: true,
      children: {
        include: {
          jobs: true,
          children: {
            include: {
              jobs: true,
              children: {
                include: {
                  jobs: true,
                  children: {
                    include: { jobs: true, children: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return folders as FolderWithRelations[];
}

function getAllJobs(folders: FolderWithRelations[]): Job[] {
  const jobs: Job[] = [];

  function collect(folder: FolderWithRelations) {
    jobs.push(...folder.jobs);
    folder.children.forEach(collect);
  }

  folders.forEach(collect);
  return jobs;
}

function countJobs(folders: FolderWithRelations[]): Record<FilterType, number> {
  let todo = 0;
  let complete = 0;
  let all = 0;

  function count(folder: FolderWithRelations) {
    // Count all jobs in this folder
    for (const job of folder.jobs) {
      all++;
      if (job.status === "WAITING" || job.status === "READY" || job.status === "IN_PROGRESS") {
        todo++;
      }
      if (job.status === "COMPLETE") {
        complete++;
      }
    }
    // Recurse into children
    folder.children.forEach(count);
  }

  folders.forEach(count);
  return { todo, complete, all };
}

function getLastRValue(jobs: Job[]): number | null {
  // Get the most recently updated job with an rValue
  const jobsWithRValue = jobs
    .filter((j) => j.rValue !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return jobsWithRValue[0]?.rValue ?? null;
}

export default async function JobsPage() {
  const folders = await getFoldersWithJobs();
  const jobs = getAllJobs(folders);
  const counts = countJobs(folders);
  const lastRValue = getLastRValue(jobs);

  return (
    <JobsPageClient
      folders={folders}
      jobs={jobs}
      counts={counts}
      lastRValue={lastRValue}
    />
  );
}
