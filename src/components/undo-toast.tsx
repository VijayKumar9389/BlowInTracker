"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import { JobStatus } from "@prisma/client";
import { updateJobStatus } from "@/app/jobs/actions";

type UndoToastProps = {
  jobId: number;
  previousStatus: JobStatus;
  onDismiss: () => void;
};

export function UndoToast({ jobId, previousStatus, onDismiss }: UndoToastProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(100);
  const dismissRef = useRef(onDismiss);
  const hasDismissedRef = useRef(false);

  // Keep the ref updated
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  const handleDismiss = useCallback(() => {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;
    // Use setTimeout to avoid updating state during render
    setTimeout(() => dismissRef.current(), 0);
  }, []);

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [handleDismiss]);

  const handleUndo = () => {
    startTransition(async () => {
      await updateJobStatus(jobId, previousStatus);
      handleDismiss();
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white rounded-full shadow-lg flex items-center gap-3 pl-5 pr-2 py-2 min-h-12">
      <span className="text-sm">Started job</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={isPending}
        className="min-h-9 px-4 text-sm font-medium bg-white text-ink rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        {isPending ? "..." : "Undo"}
      </button>
      <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
