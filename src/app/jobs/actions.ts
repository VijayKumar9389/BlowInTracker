"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { JobStatus } from "@prisma/client";

const folderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  area: z.string().optional(),
  parentId: z.string().optional(),
});

const jobSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  folderId: z.string().min(1, "Folder is required"),
  status: z.nativeEnum(JobStatus).optional(),
  rValue: z.coerce.number().int().positive().optional().nullable(),
  bags: z.coerce.number().int().nonnegative().optional().nullable(),
  sqft: z.coerce.number().int().positive().optional().nullable(),
});

export type ActionResult = {
  success: boolean;
  error?: string;
};

// Folder actions
export async function createFolder(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    area: formData.get("area") || undefined,
    parentId: formData.get("parentId") || undefined,
  };

  const parsed = folderSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.folder.create({
      data: {
        name: parsed.data.name,
        area: parsed.data.area || null,
        parentId: parsed.data.parentId || null,
      },
    });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create folder" };
  }
}

export async function renameFolder(
  id: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) {
    return { success: false, error: "Name is required" };
  }

  try {
    await prisma.folder.update({
      where: { id },
      data: { name: name.trim() },
    });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to rename folder" };
  }
}

export async function updateFolder(
  id: string,
  data: { name: string; area?: string | null }
): Promise<ActionResult> {
  if (!data.name.trim()) {
    return { success: false, error: "Name is required" };
  }

  try {
    await prisma.folder.update({
      where: { id },
      data: {
        name: data.name.trim(),
        area: data.area?.trim() || null,
      },
    });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update folder" };
  }
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { children: true, jobs: true },
    });

    if (!folder) {
      return { success: false, error: "Folder not found" };
    }

    if (folder.children.length > 0) {
      return { success: false, error: "Cannot delete folder with sub-folders" };
    }

    if (folder.jobs.length > 0) {
      return { success: false, error: "Cannot delete folder with jobs" };
    }

    await prisma.folder.delete({ where: { id } });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete folder" };
  }
}

// Job actions
export async function createJob(
  folderId: string,
  data: {
    name: string;
    status?: JobStatus;
    rValue?: number | null;
    bags?: number | null;
    sqft?: number | null;
  }
): Promise<ActionResult> {
  if (!data.name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  try {
    const status = data.status || "READY";
    await prisma.job.create({
      data: {
        name: data.name.trim(),
        folderId,
        status,
        rValue: data.rValue,
        bags: data.bags,
        sqft: data.sqft,
        completedAt: status === "COMPLETE" ? new Date() : null,
      },
    });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create job" };
  }
}

export async function updateJob(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const statusValue = formData.get("status");
  const nameValue = formData.get("name");
  console.log("updateJob called with status:", statusValue);

  const rawData = {
    name: nameValue ? (nameValue as string) : undefined,
    folderId: formData.get("folderId") as string,
    status: statusValue ? (statusValue as JobStatus) : undefined,
    rValue: formData.get("rValue") || null,
    bags: formData.get("bags") || null,
    sqft: formData.get("sqft") || null,
  };

  const parsed = jobSchema.safeParse(rawData);
  if (!parsed.success) {
    console.log("Zod parse failed:", parsed.error.issues);
    return { success: false, error: parsed.error.issues[0].message };
  }

  console.log("Parsed status:", parsed.data.status);

  try {
    // Get current job to check if status is changing to COMPLETE
    const currentJob = await prisma.job.findUnique({ where: { id } });
    const isNewlyCompleted = parsed.data.status === "COMPLETE" && currentJob?.status !== "COMPLETE";

    await prisma.job.update({
      where: { id },
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
        rValue: parsed.data.rValue,
        bags: parsed.data.bags,
        sqft: parsed.data.sqft,
        completedAt: isNewlyCompleted ? new Date() : undefined,
      },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Prisma update error:", error);
    return { success: false, error: "Failed to update job" };
  }
}

export async function updateJobName(
  id: number,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) {
    return { success: false, error: "Name is required" };
  }

  try {
    await prisma.job.update({
      where: { id },
      data: { name: name.trim() },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update job name" };
  }
}

export async function updateJobStatus(
  id: number,
  status: JobStatus
): Promise<ActionResult> {
  try {
    await prisma.job.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update job status" };
  }
}

export async function deleteJob(id: number): Promise<ActionResult> {
  try {
    await prisma.job.delete({ where: { id } });
    revalidatePath("/jobs");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete job" };
  }
}
