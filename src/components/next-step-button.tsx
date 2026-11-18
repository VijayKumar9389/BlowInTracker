"use client";

import { useTransition } from "react";
import { JobStatus } from "@prisma/client";
import { updateJobStatus } from "@/app/jobs/actions";

type NextStepButtonProps = {
  jobId?: number;
  status: JobStatus | null;
  onOpenSheet: () => void;
  onOpenViewSheet?: () => void;
  onShowUndo: (jobId: number, previousStatus: JobStatus) => void;
};

export function NextStepButton({
  jobId,
  status,
  onOpenSheet,
  onOpenViewSheet,
  onShowUndo,
}: NextStepButtonProps) {
  const [isPending, startTransition] = useTransition();

  // Complete jobs - show "View" button
  if (status === "COMPLETE" && jobId) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenViewSheet?.();
        }}
        className="h-9 px-4 text-sm font-medium text-white bg-ink rounded-full hover:bg-ink/90 transition-colors flex items-center"
      >
        View
      </button>
    );
  }

  // No job - show "Add job" with subtle outline
  if (!status || !jobId) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenSheet();
        }}
        className="h-9 px-4 text-sm font-medium text-ink bg-surface border border-line rounded-full hover:bg-line/50 transition-colors"
        aria-label="Add job"
      >
        Add job
      </button>
    );
  }

  // READY - show "Start" with outline
  if (status === "READY") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          startTransition(async () => {
            await updateJobStatus(jobId, "IN_PROGRESS");
            onShowUndo(jobId, "READY");
          });
        }}
        className="h-9 px-4 text-sm font-medium text-ink bg-white border border-ink/30 rounded-full hover:border-ink disabled:opacity-50 transition-colors"
        aria-label="Start job"
      >
        {isPending ? "..." : "Start"}
      </button>
    );
  }

  // IN_PROGRESS - show "Complete" filled black
  if (status === "IN_PROGRESS") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenSheet();
        }}
        className="h-9 px-4 text-sm font-medium text-white bg-ink rounded-full hover:bg-ink/90 transition-colors"
        aria-label="Complete job"
      >
        Complete
      </button>
    );
  }

  return null;
}
