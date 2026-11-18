"use client";

import { JobStatus } from "@prisma/client";

type StatusIconProps = {
  status: JobStatus | "NO_JOB";
  showLabel?: boolean;
  size?: "sm" | "md";
};

const statusConfig = {
  NO_JOB: {
    label: "No job",
    colorClass: "text-muted",
  },
  READY: {
    label: "Ready",
    colorClass: "text-ready",
  },
  IN_PROGRESS: {
    label: "In progress",
    colorClass: "text-progress",
  },
  COMPLETE: {
    label: "Complete",
    colorClass: "text-complete",
  },
};

export function StatusIcon({ status, showLabel = true, size = "md" }: StatusIconProps) {
  const config = statusConfig[status];
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${sizeClass} flex items-center justify-center`}>
        {status === "NO_JOB" && (
          <svg viewBox="0 0 20 20" fill="none" className={`${sizeClass} ${config.colorClass}`}>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
        )}
        {status === "READY" && (
          <svg viewBox="0 0 20 20" fill="none" className={`${sizeClass} ${config.colorClass}`}>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        {status === "IN_PROGRESS" && (
          <svg viewBox="0 0 20 20" fill="none" className={`${sizeClass} ${config.colorClass}`}>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 2a8 8 0 0 1 0 16"
              fill="currentColor"
            />
          </svg>
        )}
        {status === "COMPLETE" && (
          <svg viewBox="0 0 20 20" fill="none" className={`${sizeClass} ${config.colorClass}`}>
            <circle cx="10" cy="10" r="9" fill="currentColor" />
            <path
              d="M6 10l2.5 2.5L14 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {showLabel && (
        <span className={`text-sm ${config.colorClass}`}>{config.label}</span>
      )}
    </span>
  );
}

export function getStatusLabel(status: JobStatus | "NO_JOB"): string {
  return statusConfig[status].label;
}
