import { prisma } from "@/lib/db";
import { JobsPageClient } from "./client";
import type { LocationWithRelations, FilterType } from "@/lib/types";
import type { Job } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getLocationsWithJobs(): Promise<LocationWithRelations[]> {
  const locations = await prisma.location.findMany({
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

  return locations as LocationWithRelations[];
}

function getAllJobs(locations: LocationWithRelations[]): Job[] {
  const jobs: Job[] = [];

  function collect(loc: LocationWithRelations) {
    jobs.push(...loc.jobs);
    loc.children.forEach(collect);
  }

  locations.forEach(collect);
  return jobs;
}

function countLocations(locations: LocationWithRelations[]): Record<FilterType, number> {
  let todo = 0;
  let complete = 0;
  let all = 0;

  function count(loc: LocationWithRelations) {
    // Only count leaf locations (no children)
    if (loc.children.length === 0) {
      all++;
      const job = loc.jobs[0];
      if (job?.status === "READY" || job?.status === "IN_PROGRESS") {
        todo++;
      }
      if (job?.status === "COMPLETE") {
        complete++;
      }
    }
    loc.children.forEach(count);
  }

  locations.forEach(count);
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
  const locations = await getLocationsWithJobs();
  const jobs = getAllJobs(locations);
  const counts = countLocations(locations);
  const lastRValue = getLastRValue(jobs);

  return (
    <JobsPageClient
      locations={locations}
      jobs={jobs}
      counts={counts}
      lastRValue={lastRValue}
    />
  );
}
