"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { LocationWithRelations, FilterType } from "@/lib/types";
import { StatusIcon } from "./status-icon";
import { NextStepButton } from "./next-step-button";
import { RowMenu, RowMenuItem, RowMenuDivider } from "./row-menu";
import { JobSheet } from "./job-sheet";
import { JobViewSheet } from "./job-view-sheet";
import { EditLocationDialog } from "./edit-location-dialog";
import { UndoToast } from "./undo-toast";
import {
  createLocation,
  deleteLocation,
  deleteJob,
} from "@/app/jobs/actions";
import { JobStatus } from "@prisma/client";

// PDF Export types and functions
type JobRow = {
  locationPath: string;
  rValue: string;
  bags: string;
  sqft: string;
  completedAt: string;
};

function formatPdfDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function collectCompletedJobs(
  locations: LocationWithRelations[],
  pathParts: string[] = []
): JobRow[] {
  const rows: JobRow[] = [];

  for (const loc of locations) {
    const currentPath = [...pathParts, loc.name];

    // Check if this location has a completed job
    const job = loc.jobs[0];
    if (job?.status === "COMPLETE") {
      rows.push({
        locationPath: currentPath.join(" › "),
        rValue: job.rValue ? `R${job.rValue}` : "—",
        bags: job.bags?.toString() || "—",
        sqft: job.sqft?.toLocaleString() || "—",
        completedAt: formatPdfDate(job.completedAt),
      });
    }

    // Recurse into children
    if (loc.children.length > 0) {
      rows.push(...collectCompletedJobs(loc.children, currentPath));
    }
  }

  return rows;
}

function exportLocationPdf(location: LocationWithRelations) {
  const rows = collectCompletedJobs([location]);

  if (rows.length === 0) {
    alert("No completed jobs to export");
    return;
  }

  // Calculate totals
  const totalBags = rows.reduce((sum, r) => sum + (parseInt(r.bags) || 0), 0);
  const totalSqft = rows.reduce((sum, r) => sum + (parseInt(r.sqft.replace(/,/g, "")) || 0), 0);

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(location.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Completed Jobs Report`, 14, 28);
  doc.text(`Generated: ${formatPdfDate(new Date())}`, 14, 34);
  doc.setTextColor(0);

  // Summary box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 40, pageWidth - 28, 20, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${rows.length} Jobs`, 20, 50);
  doc.text(`${totalBags.toLocaleString()} Bags`, 70, 50);
  doc.text(`${totalSqft.toLocaleString()} Sqft`, 130, 50);

  // Table
  autoTable(doc, {
    startY: 68,
    head: [["Location", "R-Value", "Bags", "Sqft", "Completed"]],
    body: rows.map((r) => [
      r.locationPath,
      r.rValue,
      r.bags,
      r.sqft,
      r.completedAt,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 30 },
    },
  });

  // Save with location name in filename
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = location.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`${safeName}-report-${dateStr}.pdf`);
}

type LocationTreeProps = {
  locations: LocationWithRelations[];
  filter: FilterType;
  searchQuery: string;
  lastRValue: number | null;
};

function countJobsRecursive(location: LocationWithRelations): {
  total: number;
  complete: number;
  bags: number;
  sqft: number;
  latestDate: Date | null;
} {
  let total = location.jobs.length;
  let complete = location.jobs.filter((j) => j.status === "COMPLETE").length;
  let bags = location.jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  let sqft = location.jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);
  let latestDate: Date | null = location.jobs.length > 0
    ? new Date(Math.max(...location.jobs.map(j => new Date(j.updatedAt).getTime())))
    : null;

  for (const child of location.children) {
    const childCounts = countJobsRecursive(child);
    total += childCounts.total;
    complete += childCounts.complete;
    bags += childCounts.bags;
    sqft += childCounts.sqft;
    if (childCounts.latestDate) {
      if (!latestDate || childCounts.latestDate > latestDate) {
        latestDate = childCounts.latestDate;
      }
    }
  }

  return { total, complete, bags, sqft, latestDate };
}

function matchesFilter(location: LocationWithRelations, filter: FilterType): boolean {
  if (filter === "all") return true;
  const job = location.jobs[0];
  if (filter === "todo") {
    return job?.status === "READY" || job?.status === "IN_PROGRESS";
  }
  if (filter === "complete") {
    return job?.status === "COMPLETE";
  }
  return true;
}

function hasMatchingDescendant(location: LocationWithRelations, filter: FilterType): boolean {
  if (matchesFilter(location, filter)) return true;
  return location.children.some((child) => hasMatchingDescendant(child, filter));
}

function matchesSearch(location: LocationWithRelations, query: string): boolean {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return location.name.toLowerCase().includes(lowerQuery) ||
    (location.area?.toLowerCase().includes(lowerQuery) ?? false);
}

function hasMatchingSearchDescendant(location: LocationWithRelations, query: string): boolean {
  if (matchesSearch(location, query)) return true;
  return location.children.some((child) => hasMatchingSearchDescendant(child, query));
}

function allJobsComplete(location: LocationWithRelations): boolean {
  const { total, complete } = countJobsRecursive(location);
  return total > 0 && total === complete;
}

type UndoState = {
  jobId: number;
  previousStatus: JobStatus;
} | null;

type LocationRowProps = {
  location: LocationWithRelations;
  depth: number;
  filter: FilterType;
  searchQuery: string;
  lastRValue: number | null;
  undoState: UndoState;
  onShowUndo: (jobId: number, previousStatus: JobStatus) => void;
  isTopLevel: boolean;
};

function TreeGuides({ depth, isMobile }: { depth: number; isMobile?: boolean }) {
  const guideWidth = isMobile ? "w-4" : "w-7";
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

function LocationRow({
  location,
  depth,
  filter,
  searchQuery,
  lastRValue,
  undoState,
  onShowUndo,
  isTopLevel,
}: LocationRowProps) {
  const hasChildren = location.children.length > 0;
  const job = location.jobs[0];
  const { total, complete, bags: totalBags, sqft: totalSqft, latestDate } = countJobsRecursive(location);
  const progressPercent = total > 0 ? (complete / total) * 100 : 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"edit" | "complete">("edit");
  const [unitName, setUnitName] = useState("");
  const [isPending, startTransition] = useTransition();

  const matchesCurrentFilter = hasMatchingDescendant(location, filter);
  // Only apply search at top level - children always show if parent matches
  const matchesCurrentSearch = isTopLevel ? hasMatchingSearchDescendant(location, searchQuery) : true;

  if (!matchesCurrentFilter || !matchesCurrentSearch) return null;

  // Only filter children by status filter, not by search
  const filteredChildren = location.children.filter(
    (child) => hasMatchingDescendant(child, filter)
  );

  const handleRowClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAddUnit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", unitName);
      formData.set("parentId", location.id);
      const result = await createLocation(formData);
      if (result.success) {
        setIsAddingUnit(false);
        setUnitName("");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLocation(location.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleDeleteJob = () => {
    if (!job || !confirm("Delete this job?")) return;
    startTransition(async () => {
      await deleteJob(job.id);
    });
  };

  const handleOpenSheet = () => {
    setSheetMode(job?.status === "IN_PROGRESS" ? "complete" : "edit");
    setIsSheetOpen(true);
  };

  const handleAddJob = () => {
    startTransition(async () => {
      const { createJob } = await import("@/app/jobs/actions");
      await createJob(location.id, { status: "READY" });
    });
  };

  const canDelete = !hasChildren && location.jobs.length === 0;
  const isComplete = job?.status === "COMPLETE";
  const isInProgress = job?.status === "IN_PROGRESS";

  // Row background classes
  const getRowBgClass = () => {
    if (isTopLevel) return "bg-ink/[0.03]";
    if (!hasChildren && isInProgress) return "bg-progress/5";
    return "";
  };

  // Text classes for complete state
  const getTextClass = () => {
    if (!hasChildren && isComplete) return "text-ink/60";
    return "text-ink";
  };

  return (
    <>
      {/* Desktop row (≥768px) */}
      <div
        className={`hidden md:flex items-stretch ${isTopLevel ? "border-t-2 border-t-ink/10" : "border-b border-line"} ${isPending ? "opacity-50" : ""} ${getRowBgClass()}`}
      >
        {/* Tree guides */}
        <TreeGuides depth={depth} />

        {/* Clickable name area */}
        <div
          className={`flex-1 flex items-center min-w-0 min-h-14 py-2 ${hasChildren ? "cursor-pointer" : ""} transition-colors`}
          onClick={hasChildren ? handleRowClick : undefined}
        >
          {/* Status icon for leaves */}
          {!hasChildren && (
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <StatusIcon status={job?.status || "NO_JOB"} showLabel={false} size="sm" />
            </div>
          )}

          {/* Expand indicator for parents */}
          {hasChildren && (
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <svg
                className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}

          {/* Name block */}
          <div className={`flex-1 min-w-0 pr-4 ${getTextClass()}`}>
            <div className={`truncate ${isTopLevel ? "font-semibold text-lg" : "font-medium"}`}>
              {location.name}
            </div>
            {location.area && (
              <div className="text-xs text-muted truncate">{location.area}</div>
            )}
          </div>
        </div>

        {/* Fixed data columns - outside clickable area */}
        {/* Status slot - w-32 */}
        <div className="w-32 flex-shrink-0 flex items-center">
          {hasChildren ? (
            <div className="flex flex-col items-start gap-0.5">
              <div className="w-10 h-1 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-complete rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted tabular-nums">{complete} of {total}</span>
            </div>
          ) : (
            <span className={`text-sm ${job ? "text-ink" : "text-muted"}`}>
              {job ? (job.status === "IN_PROGRESS" ? "In progress" : job.status === "COMPLETE" ? "Complete" : "Ready") : "No job"}
            </span>
          )}
        </div>

        {/* R-value slot - w-14 */}
        <div className={`w-14 flex-shrink-0 flex items-center justify-end tabular-nums ${getTextClass()}`}>
          {!hasChildren && job?.rValue && (
            <span className="text-sm">R{job.rValue}</span>
          )}
        </div>

        {/* Bags slot - w-24 */}
        <div className={`w-24 flex-shrink-0 flex items-center justify-end tabular-nums ${getTextClass()}`}>
          {hasChildren ? (
            totalBags > 0 && (
              <span className="text-sm font-semibold">
                {totalBags}<span className="text-muted font-normal ml-1">bags</span>
              </span>
            )
          ) : (
            job?.bags != null && job.bags > 0 && (
              <span className="text-sm">
                {job.bags}<span className="text-muted ml-1">bags</span>
              </span>
            )
          )}
        </div>

        {/* Sqft slot - w-24 */}
        <div className={`w-24 flex-shrink-0 flex items-center justify-end tabular-nums ${getTextClass()}`}>
          {hasChildren ? (
            totalSqft > 0 && (
              <span className="text-sm font-semibold">
                {totalSqft.toLocaleString()}<span className="text-muted font-normal ml-1">sqft</span>
              </span>
            )
          ) : (
            job?.sqft && (
              <span className="text-sm">
                {job.sqft.toLocaleString()}<span className="text-muted ml-1">sqft</span>
              </span>
            )
          )}
        </div>

        {/* Date slot - w-32 */}
        <div className="w-32 flex-shrink-0 flex items-center justify-end text-sm text-muted tabular-nums pr-4">
          {!hasChildren && job && (
            <span>
              {job.status === "COMPLETE" ? "Done " : job.status === "IN_PROGRESS" ? "Started " : "Ready "}
              {formatDate(job.status === "COMPLETE" && job.completedAt ? job.completedAt : job.updatedAt)}
            </span>
          )}
        </div>

        {/* Action slot - w-40 */}
        <div className="w-40 flex-shrink-0 flex items-center justify-end gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
          {!job && (
            <NextStepButton
              jobId={undefined}
              status={null}
              onOpenSheet={handleAddJob}
              onShowUndo={onShowUndo}
            />
          )}
          {job && (
            <NextStepButton
              jobId={job.id}
              status={job.status}
              onOpenSheet={handleOpenSheet}
              onOpenViewSheet={() => setIsViewSheetOpen(true)}
              onShowUndo={onShowUndo}
            />
          )}

          {/* Menu */}
          <RowMenu title={location.name} subtitle={location.area || undefined}>
            {hasChildren ? (
              <>
                {isTopLevel && (
                  <>
                    <RowMenuItem onClick={() => exportLocationPdf(location)}>Export PDF</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                {job && (
                  <>
                    <RowMenuItem onClick={handleOpenSheet}>Edit bags / R-value / sqft</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuDivider />
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit location</RowMenuItem>
                {job && <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>}
                <RowMenuItem
                  onClick={handleDelete}
                  disabled={!canDelete}
                  hint={!canDelete ? "Has children or jobs" : undefined}
                  variant="danger"
                >
                  Delete location
                </RowMenuItem>
              </>
            ) : job ? (
              <>
                {isComplete && (
                  <>
                    <RowMenuItem onClick={() => setIsViewSheetOpen(true)}>View record</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                <RowMenuItem onClick={handleOpenSheet}>Edit bags / R-value / sqft</RowMenuItem>
                <RowMenuDivider />
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit location</RowMenuItem>
                <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>
              </>
            ) : (
              <>
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuDivider />
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit</RowMenuItem>
                <RowMenuItem
                  onClick={handleDelete}
                  disabled={!canDelete}
                  hint={!canDelete ? "Has children or jobs" : undefined}
                  variant="danger"
                >
                  Delete
                </RowMenuItem>
              </>
            )}
          </RowMenu>
        </div>
      </div>

      {/* Mobile row (<768px) */}
      <div
        className={`md:hidden flex items-stretch ${isTopLevel ? "border-t-2 border-t-ink/10" : "border-b border-line"} ${isPending ? "opacity-50" : ""} ${getRowBgClass()}`}
      >
        {/* Tree guides */}
        <TreeGuides depth={depth} isMobile />

        {/* Clickable content */}
        <div
          className={`flex-1 min-w-0 flex items-center min-h-16 py-2 ${hasChildren ? "cursor-pointer" : ""}`}
          onClick={hasChildren ? handleRowClick : undefined}
        >
          {/* Status icon / expand indicator */}
          <div className="w-7 flex-shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <svg
                className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <StatusIcon status={job?.status || "NO_JOB"} showLabel={false} size="sm" />
            )}
          </div>

          {/* Name block */}
          <div className={`flex-1 min-w-0 pr-2 ${getTextClass()}`}>
            <div className={`truncate ${isTopLevel ? "font-semibold" : "font-medium"}`}>
              {location.name}
            </div>
            <div className="text-xs text-muted truncate">
              {!hasChildren && isInProgress && job?.bags ? (
                `${job.bags} bags so far`
              ) : (
                location.area || (hasChildren ? `${complete} of ${total} done` : null)
              )}
            </div>
          </div>
        </div>

        {/* Right side: number slot or action button */}
        <div className="flex-shrink-0 flex items-center pr-2" onClick={(e) => e.stopPropagation()}>
          {/* Show numbers for complete jobs and parents without active jobs */}
          {(hasChildren && (!job || isComplete)) || (!hasChildren && isComplete) ? (
            <div className="w-20 text-right pr-2">
              {(hasChildren ? totalBags > 0 : job?.bags) && (
                <>
                  <div className={`text-sm tabular-nums ${hasChildren ? "font-semibold" : ""} ${getTextClass()}`}>
                    {hasChildren ? totalBags : job?.bags}
                    <span className="text-muted text-xs ml-1">bags</span>
                  </div>
                  <div className="text-xs text-muted tabular-nums">
                    {hasChildren ? (
                      `${complete} of ${total}`
                    ) : (
                      job?.rValue && job?.sqft ? `R${job.rValue} · ${job.sqft}` : job?.rValue ? `R${job.rValue}` : job?.sqft ? `${job.sqft} sqft` : null
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Show next-step button for active jobs (any location) or leaves without jobs */
            <NextStepButton
              jobId={job?.id}
              status={job?.status || null}
              onOpenSheet={job ? handleOpenSheet : handleAddJob}
              onOpenViewSheet={() => setIsViewSheetOpen(true)}
              onShowUndo={onShowUndo}
            />
          )}

          {/* Menu */}
          <RowMenu title={location.name} subtitle={location.area || undefined}>
            {hasChildren ? (
              <>
                {isTopLevel && (
                  <>
                    <RowMenuItem onClick={() => exportLocationPdf(location)}>Export PDF</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                {job && (
                  <>
                    <RowMenuItem onClick={handleOpenSheet}>Edit bags / R-value / sqft</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuDivider />
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit location</RowMenuItem>
                {job && <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>}
                <RowMenuItem
                  onClick={handleDelete}
                  disabled={!canDelete}
                  hint={!canDelete ? "Has children or jobs" : undefined}
                  variant="danger"
                >
                  Delete location
                </RowMenuItem>
              </>
            ) : job ? (
              <>
                {isComplete && (
                  <>
                    <RowMenuItem onClick={() => setIsViewSheetOpen(true)}>View record</RowMenuItem>
                    <RowMenuDivider />
                  </>
                )}
                <RowMenuItem onClick={handleOpenSheet}>Edit bags / R-value / sqft</RowMenuItem>
                <RowMenuDivider />
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit location</RowMenuItem>
                <RowMenuItem onClick={handleDeleteJob} variant="danger">Delete job</RowMenuItem>
              </>
            ) : (
              <>
                {depth < 3 && <RowMenuItem onClick={() => setIsAddingUnit(true)}>Add unit</RowMenuItem>}
                <RowMenuDivider />
                <RowMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit</RowMenuItem>
                <RowMenuItem
                  onClick={handleDelete}
                  disabled={!canDelete}
                  hint={!canDelete ? "Has children or jobs" : undefined}
                  variant="danger"
                >
                  Delete
                </RowMenuItem>
              </>
            )}
          </RowMenu>
        </div>
      </div>

      {/* Add unit form */}
      {isAddingUnit && (
        <div className="flex items-center gap-2 py-3 px-4 border-b border-line bg-surface">
          <TreeGuides depth={depth + 1} />
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="Unit name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddUnit();
              if (e.key === "Escape") {
                setIsAddingUnit(false);
                setUnitName("");
              }
            }}
            autoFocus
            className="flex-1 h-10 px-3 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
          <button
            onClick={handleAddUnit}
            disabled={!unitName.trim()}
            className="h-10 px-4 bg-ink text-white text-sm rounded-full disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAddingUnit(false);
              setUnitName("");
            }}
            className="h-10 px-3 text-sm text-muted"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Job Sheet */}
      <JobSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        location={location}
        job={job}
        mode={sheetMode}
        lastRValue={lastRValue}
      />

      {/* Job View Sheet */}
      {job && (
        <JobViewSheet
          open={isViewSheetOpen}
          onClose={() => setIsViewSheetOpen(false)}
          location={location}
          job={job}
        />
      )}

      {/* Edit Location Dialog */}
      <EditLocationDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        location={location}
      />

      {/* Children */}
      {isExpanded &&
        filteredChildren.map((child) => (
          <LocationRow
            key={child.id}
            location={child}
            depth={depth + 1}
            filter={filter}
            searchQuery={searchQuery}
            lastRValue={lastRValue}
            undoState={undoState}
            onShowUndo={onShowUndo}
            isTopLevel={false}
          />
        ))}
    </>
  );
}

export function LocationTree({ locations, filter, searchQuery, lastRValue }: LocationTreeProps) {
  const [undoState, setUndoState] = useState<UndoState>(null);

  const handleShowUndo = useCallback((jobId: number, previousStatus: JobStatus) => {
    setUndoState({ jobId, previousStatus });
  }, []);

  const handleDismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  const filteredLocations = locations.filter(
    (loc) =>
      hasMatchingDescendant(loc, filter) &&
      hasMatchingSearchDescendant(loc, searchQuery)
  );

  if (filteredLocations.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        {searchQuery ? "No locations match your search" : "No locations match this filter"}
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-line">
        {filteredLocations.map((location) => (
          <LocationRow
            key={location.id}
            location={location}
            depth={0}
            filter={filter}
            searchQuery={searchQuery}
            lastRValue={lastRValue}
            undoState={undoState}
            onShowUndo={handleShowUndo}
            isTopLevel={true}
          />
        ))}
      </div>

      {undoState && (
        <UndoToast
          jobId={undoState.jobId}
          previousStatus={undoState.previousStatus}
          onDismiss={handleDismissUndo}
        />
      )}
    </>
  );
}
