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
  if (status === "WAITING") {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-waiting border-dashed" />
    );
  }

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
  const isWaiting = job.status === "WAITING";

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
    if (isWaiting) {
      return "Waiting";
    }
    if (isReady) {
      return job.rValue ? `Ready · R${job.rValue}` : "Ready";
    }
    if (isInProgress) {
      return job.bags ? `In progress · ${job.bags} bags` : "In progress";
    }
    // Complete - R-value shown in stacked metrics, just show date
    return job.completedAt ? formatDate(job.completedAt) : "Complete";
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

        {/* Status chip */}
        <div className="w-28 flex-shrink-0 flex items-center">
          {isWaiting && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-waiting/15 text-waiting">
              Waiting
            </span>
          )}
          {isReady && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ready/15 text-ready">
              Ready
            </span>
          )}
          {isInProgress && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-progress/15 text-progress">
              In progress
            </span>
          )}
          {isComplete && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-complete/15 text-complete">
              {job.completedAt ? formatDate(job.completedAt) : "Complete"}
            </span>
          )}
        </div>

        {/* R-value slot */}
        <div className={`w-16 flex-shrink-0 flex items-center justify-end ${getTextClass()}`}>
          {job.rValue && (
            <span className="text-sm tabular-nums">R{job.rValue}</span>
          )}
        </div>

        {/* Bags slot */}
        <div className={`w-24 flex-shrink-0 flex items-center justify-end ${getTextClass()}`}>
          {job.bags != null && job.bags > 0 && (
            <span className="text-sm">
              <span className="tabular-nums font-semibold">{job.bags}</span>
              <span className="text-muted ml-1">bags</span>
            </span>
          )}
        </div>

        {/* Sqft slot */}
        <div className={`w-28 flex-shrink-0 flex items-center justify-end ${getTextClass()}`}>
          {job.sqft && (
            <span className="text-sm">
              <span className="tabular-nums">{job.sqft.toLocaleString()}</span>
              <span className="text-muted ml-1">sqft</span>
            </span>
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
            <RowMenuItem
              onClick={handleOpenSheet}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            >
              Edit job
            </RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem
              onClick={handleDeleteJob}
              variant="danger"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            >
              Delete job
            </RowMenuItem>
          </RowMenu>
        </div>
      </div>

      {/* Mobile row */}
      <div
        className={`md:hidden flex items-stretch pl-3 border-b border-line ${isPending ? "opacity-50" : ""} ${getRowBgClass()} ${isComplete ? "active:bg-surface/80 cursor-pointer" : ""}`}
        onClick={isComplete ? handleRowClick : undefined}
      >
        <TreeGuides depth={depth} isMobile />

        <div className="flex-1 min-w-0 flex items-center min-h-16 py-3">
          {/* Spacer to align with folder chevron */}
          <div className="w-4 flex-shrink-0" />

          {/* Status ring */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <StatusRing status={job.status} />
          </div>

          {/* Name and metrics */}
          <div className={`flex-1 min-w-0 pr-2 ${getTextClass()}`}>
            <div className="truncate">{job.name}</div>
            {isComplete ? (
              <div className="text-xs text-muted">
                {[
                  job.completedAt ? formatDate(job.completedAt) : null,
                  job.bags ? <span key="bags"><span className="font-semibold text-ink/70">{job.bags}</span> bags</span> : null,
                  job.sqft ? <span key="sqft">{job.sqft.toLocaleString()} sqft</span> : null,
                  job.rValue ? <span key="rvalue">R{job.rValue}</span> : null,
                ].filter(Boolean).map((item, i, arr) => (
                  <span key={i}>{item}{i < arr.length - 1 ? <span className="mx-1.5">·</span> : ""}</span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted">
                {getMobileSubtext()}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-0.5 pr-2" onClick={(e) => e.stopPropagation()}>
          {!isComplete && (
            <NextStepButton
              jobId={job.id}
              status={job.status}
              onOpenSheet={handleOpenSheet}
              onShowUndo={onShowUndo}
            />
          )}

          <RowMenu title={job.name}>
            <RowMenuItem
              onClick={handleOpenSheet}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            >
              Edit job
            </RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem
              onClick={handleDeleteJob}
              variant="danger"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            >
              Delete job
            </RowMenuItem>
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
