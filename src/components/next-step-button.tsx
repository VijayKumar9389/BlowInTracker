"use client";

import { useTransition } from "react";
import { JobStatus } from "@prisma/client";
import { updateJobStatus } from "@/app/jobs/actions";

type NextStepButtonProps = {
  jobId?: number;
  status: JobStatus | null;
  onOpenSheet: () => void;
  onShowUndo: (jobId: number, previousStatus: JobStatus) => void;
};

export function NextStepButton({
  jobId,
  status,
  onOpenSheet,
  onShowUndo,
}: NextStepButtonProps) {
  const [isPending, startTransition] = useTransition();

  // Complete jobs - no button (tap row to open record)
  if (status === "COMPLETE") {
    return null;
  }

  // No job - shouldn't happen but handle gracefully
  if (!status || !jobId) {
    return null;
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
        className="h-9 md:h-9 min-h-11 md:min-h-0 px-4 text-sm font-medium text-ink border border-line rounded-full hover:border-ink disabled:opacity-50 transition-colors"
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
        className="h-9 md:h-9 min-h-11 md:min-h-0 px-4 text-sm font-medium text-white bg-ink rounded-full hover:bg-ink/90 transition-colors"
        aria-label="Complete job"
      >
        Complete
      </button>
    );
  }

  return null;
}
