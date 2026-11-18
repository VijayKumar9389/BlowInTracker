"use client";

import { useState, useTransition } from "react";
import type { Job, Folder } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import { NextStepButton } from "./next-step-button";
import { RowMenu, RowMenuItem, RowMenuDivider } from "./row-menu";
import { JobSheet } from "./job-sheet";
import { JobViewSheet } from "./job-view-sheet";
import { deleteJob } from "@/app/jobs/actions";

type JobRowProps = {
  job: Job;
  folder: Folder;
  depth: number;
  lastRValue: number | null;
  onShowUndo: (jobId: number, previousStatus: JobStatus) => void;
};

function TreeGuides({ depth, isMobile }: { depth: number; isMobile?: boolean }) {
  const guideWidth = isMobile ? "w-4" : "w-6";
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} className={`${guideWidth} flex-shrink-0 flex justify-center`}>
          <div className="w-px h-full bg-line" />
        </div>
      ))}
    </>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function StatusRing({ status }: { status: JobStatus }) {
  if (status === "READY") {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-ready" />
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-progress relative overflow-hidden">
        <div className="absolute inset-0 bg-progress" style={{ clipPath: "inset(50% 0 0 0)" }} />
      </div>
    );
  }

  // COMPLETE
  return (
    <div className="w-4 h-4 rounded-full bg-complete flex items-center justify-center">
      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export function JobRow({
  job,
  folder,
  depth,
  lastRValue,
  onShowUndo,
}: JobRowProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"edit" | "complete">("edit");
  const [isPending, startTransition] = useTransition();

  const isComplete = job.status === "COMPLETE";
  const isInProgress = job.status === "IN_PROGRESS";
  const isReady = job.status === "READY";

  const getRowBgClass = () => {
    if (isInProgress) return "bg-progress/5";
    return "";
  };

  const getTextClass = () => {
    if (isComplete) return "text-ink/70";
    return "text-ink";
  };

  const handleOpenSheet = () => {
    setSheetMode(isInProgress ? "complete" : "edit");
    setIsSheetOpen(true);
  };

  const handleRowClick = () => {
    if (isComplete) {
      setIsViewSheetOpen(true);
    }
  };

  const handleDeleteJob = () => {
    if (!confirm("Delete this job?")) return;
    startTransition(async () => {
      await deleteJob(job.id);
    });
  };

  // Mobile second line content
  const getMobileSubtext = () => {
    if (isReady) {
      return job.rValue ? `Ready · R${job.rValue}` : "Ready";
    }
    if (isInProgress) {
      return job.bags ? `In progress · ${job.bags} bags` : "In progress";
    }
    // Complete
    const parts = [];
    if (job.rValue) parts.push(`R${job.rValue}`);
    if (job.completedAt) parts.push(formatDate(job.completedAt));
    return parts.join(" · ") || "Complete";
  };

  return (
    <>
      {/* Desktop row */}
      <div
        className={`hidden md:flex items-stretch pl-3 border-b border-line ${isPending ? "opacity-50" : ""} ${getRowBgClass()} ${isComplete ? "hover:bg-surface/80 cursor-pointer" : "hover:bg-surface/50"} transition-colors`}
        onClick={isComplete ? handleRowClick : undefined}
      >
        <TreeGuides depth={depth} />

        <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
          {/* Spacer to align with folder chevron */}
          <div className="w-6 flex-shrink-0" />

          {/* Status ring */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <StatusRing status={job.status} />
          </div>

          {/* Name */}
          <div className={`flex-1 min-w-0 pr-4 ${getTextClass()}`}>
            <div className="truncate">{job.name}</div>
          </div>
        </div>

        {/* Status label */}
        <div className="w-28 flex-shrink-0 flex items-center">
          <span className="text-sm text-ink">
            {isInProgress ? "In progress" : isComplete ? "Complete" : "Ready"}
          </span>
        </div>

        {/* Bags slot */}
        <div className={`w-20 flex-shrink-0 flex items-center justify-end tabular-nums ${getTextClass()}`}>
          {job.bags != null && job.bags > 0 && (
            <span className="text-sm">{job.bags}</span>
          )}
        </div>

        {/* Sqft slot */}
        <div className={`w-24 flex-shrink-0 flex items-center justify-end tabular-nums ${getTextClass()}`}>
          {job.sqft && (
            <span className="text-sm">{job.sqft.toLocaleString()}</span>
          )}
        </div>

        {/* Action slot */}
        <div className="w-24 flex-shrink-0 flex items-center justify-end gap-0.5 pr-2" onClick={(e) => e.stopPropagation()}>
          {!isComplete && (
            <NextStepButton
              jobId={job.id}
              status={job.status}
              onOpenSheet={handleOpenSheet}
              onShowUndo={onShowUndo}
            />
          )}

          <RowMenu title={job.name}>
            <RowMenuItem onClick={handleOpenSheet}>Edit job</RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>
          </RowMenu>
        </div>
      </div>

      {/* Mobile row */}
      <div
        className={`md:hidden flex items-stretch pl-3 border-b border-line ${isPending ? "opacity-50" : ""} ${getRowBgClass()} ${isComplete ? "active:bg-surface/80 cursor-pointer" : ""}`}
        onClick={isComplete ? handleRowClick : undefined}
      >
        <TreeGuides depth={depth} isMobile />

        <div className="flex-1 min-w-0 flex items-center min-h-14 py-2">
          {/* Spacer to align with folder chevron */}
          <div className="w-4 flex-shrink-0" />

          {/* Status ring */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <StatusRing status={job.status} />
          </div>

          {/* Name */}
          <div className={`flex-1 min-w-0 pr-2 ${getTextClass()}`}>
            <div className="truncate">{job.name}</div>
            <div className="text-xs text-muted truncate">
              {getMobileSubtext()}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-0.5 pr-2" onClick={(e) => e.stopPropagation()}>
          {isComplete && job.bags ? (
            <div className="w-16 text-right pr-1">
              <div className={`text-sm tabular-nums ${getTextClass()}`}>
                {job.bags}
              </div>
              {job.sqft && (
                <div className="text-xs text-muted tabular-nums">
                  {job.sqft.toLocaleString()}
                </div>
              )}
            </div>
          ) : !isComplete ? (
            <NextStepButton
              jobId={job.id}
              status={job.status}
              onOpenSheet={handleOpenSheet}
              onShowUndo={onShowUndo}
            />
          ) : null}

          <RowMenu title={job.name}>
            <RowMenuItem onClick={handleOpenSheet}>Edit job</RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>
          </RowMenu>
        </div>
      </div>

      {/* Job Sheet */}
      <JobSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        folder={folder}
        job={job}
        mode={sheetMode}
        lastRValue={lastRValue}
      />

      {/* Job View Sheet */}
      <JobViewSheet
        open={isViewSheetOpen}
        onClose={() => setIsViewSheetOpen(false)}
        folder={folder}
        job={job}
      />
    </>
  );
}
