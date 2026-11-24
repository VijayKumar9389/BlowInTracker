import { prisma } from "@/lib/db";
import { JobsPageClient } from "./client";
import type { FolderWithRelations } from "@/lib/types";
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
  const lastRValue = getLastRValue(jobs);

  return (
    <JobsPageClient
      folders={folders}
      jobs={jobs}
      lastRValue={lastRValue}
    />
  );
}
