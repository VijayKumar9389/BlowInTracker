"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { FolderWithRelations, FilterType } from "@/lib/types";
import { RowMenu, RowMenuItem, RowMenuDivider, AddMenu } from "./row-menu";
import { EditFolderDialog } from "./edit-folder-dialog";
import { MoveDialog } from "./move-dialog";
import { UndoToast } from "./undo-toast";
import {
  createFolder,
  deleteFolder,
} from "@/app/jobs/actions";
import { JobStatus } from "@prisma/client";
import { MAX_FOLDER_DEPTH } from "@/lib/constants";
import { AddJobDialog } from "./add-job-dialog";
import { JobRow } from "./job-row";

// Natural sort comparator
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// PDF Export types and functions
type PdfJobRow = {
  folderPath: string;
  rValue: string;
  bags: string;
  sqft: string;
  status: string;
};

function formatPdfDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function collectAllJobs(
  folders: FolderWithRelations[],
  pathParts: string[] = []
): PdfJobRow[] {
  const rows: PdfJobRow[] = [];

  for (const loc of folders) {
    const currentPath = [...pathParts, loc.name];

    for (const job of loc.jobs) {
      rows.push({
        folderPath: [...currentPath, job.name].join(" › "),
        rValue: job.rValue ? `R${job.rValue}` : "—",
        bags: job.bags?.toString() || "—",
        sqft: job.sqft?.toLocaleString() || "—",
        status: job.status === "COMPLETE" ? `Done ${formatPdfDate(job.completedAt)}` : job.status === "IN_PROGRESS" ? "In Progress" : "Ready",
      });
    }

    if (loc.children.length > 0) {
      rows.push(...collectAllJobs(loc.children, currentPath));
    }
  }

  return rows;
}

function exportFolderPdf(folder: FolderWithRelations) {
  const rows = collectAllJobs([folder]);

  if (rows.length === 0) {
    alert("No jobs to export");
    return;
  }

  const totalBags = rows.reduce((sum, r) => sum + (parseInt(r.bags) || 0), 0);
  const totalSqft = rows.reduce((sum, r) => sum + (parseInt(r.sqft.replace(/,/g, "")) || 0), 0);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(folder.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Jobs Report`, 14, 28);
  doc.text(`Generated: ${formatPdfDate(new Date())}`, 14, 34);
  doc.setTextColor(0);

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 40, pageWidth - 28, 20, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${rows.length} Jobs`, 20, 50);
  doc.text(`${totalBags.toLocaleString()} Bags`, 70, 50);
  doc.text(`${totalSqft.toLocaleString()} Sqft`, 130, 50);

  autoTable(doc, {
    startY: 68,
    head: [["Location", "R-Value", "Bags", "Sqft", "Status"]],
    body: rows.map((r) => [r.folderPath, r.rValue, r.bags, r.sqft, r.status]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [10, 10, 10], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 30 },
    },
  });

  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = folder.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`${safeName}-report-${dateStr}.pdf`);
}

type FolderTreeProps = {
  folders: FolderWithRelations[];
  filter: FilterType;
  searchQuery: string;
  lastRValue: number | null;
};

function countJobsRecursive(folder: FolderWithRelations): {
  total: number;
  complete: number;
  bags: number;
  sqft: number;
} {
  let total = folder.jobs.length;
  let complete = folder.jobs.filter((j) => j.status === "COMPLETE").length;
  let bags = folder.jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  let sqft = folder.jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);

  for (const child of folder.children) {
    const childCounts = countJobsRecursive(child);
    total += childCounts.total;
    complete += childCounts.complete;
    bags += childCounts.bags;
    sqft += childCounts.sqft;
  }

  return { total, complete, bags, sqft };
}

function matchesFilter(folder: FolderWithRelations, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "todo") {
    return folder.jobs.some(job => job.status === "READY" || job.status === "IN_PROGRESS");
  }
  if (filter === "complete") {
    return folder.jobs.some(job => job.status === "COMPLETE");
  }
  return true;
}

function hasMatchingDescendant(folder: FolderWithRelations, filter: FilterType): boolean {
  if (matchesFilter(folder, filter)) return true;
  return folder.children.some((child) => hasMatchingDescendant(child, filter));
}

function matchesSearch(folder: FolderWithRelations, query: string): boolean {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  if (folder.name.toLowerCase().includes(lowerQuery) ||
      (folder.area?.toLowerCase().includes(lowerQuery) ?? false)) {
    return true;
  }
  return folder.jobs.some(job => job.name.toLowerCase().includes(lowerQuery));
}

function hasMatchingSearchDescendant(folder: FolderWithRelations, query: string): boolean {
  if (matchesSearch(folder, query)) return true;
  return folder.children.some((child) => hasMatchingSearchDescendant(child, query));
}

type UndoState = {
  jobId: number;
  previousStatus: JobStatus;
} | null;

type FolderRowProps = {
  folder: FolderWithRelations;
  depth: number;
  filter: FilterType;
  searchQuery: string;
  lastRValue: number | null;
  undoState: UndoState;
  onShowUndo: (jobId: number, previousStatus: JobStatus) => void;
  isTopLevel: boolean;
  isFirst?: boolean;
  expandedFolders: Set<string>;
  onToggleExpanded: (folderId: string) => void;
  allFolders: FolderWithRelations[];
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

function FolderRow({
  folder,
  depth,
  filter,
  searchQuery,
  lastRValue,
  undoState,
  onShowUndo,
  isTopLevel,
  isFirst = false,
  expandedFolders,
  onToggleExpanded,
  allFolders,
}: FolderRowProps) {
  const hasSubfolders = folder.children.length > 0;
  const hasJobs = folder.jobs.length > 0;
  const hasContents = hasSubfolders || hasJobs;
  const { total, complete, bags: totalBags, sqft: totalSqft } = countJobsRecursive(folder);
  const progressPercent = total > 0 ? (complete / total) * 100 : 0;
  const allComplete = total > 0 && total === complete;
  const isEmpty = total === 0;

  const isExpanded = expandedFolders.has(folder.id);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [isPending, startTransition] = useTransition();

  const matchesCurrentFilter = hasMatchingDescendant(folder, filter);
  const matchesCurrentSearch = isTopLevel ? hasMatchingSearchDescendant(folder, searchQuery) : true;

  if (!matchesCurrentFilter || !matchesCurrentSearch) return null;

  const filteredChildren = folder.children
    .filter((child) => hasMatchingDescendant(child, filter))
    .sort((a, b) => naturalSort(a.name, b.name));

  const sortedJobs = [...folder.jobs].sort((a, b) => naturalSort(a.name, b.name));

  const handleRowClick = () => {
    if (hasContents) {
      onToggleExpanded(folder.id);
    }
  };

  const handleAddUnit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", unitName);
      formData.set("parentId", folder.id);
      const result = await createFolder(formData);
      if (result.success) {
        setIsAddingUnit(false);
        setUnitName("");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFolder(folder.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleAddJob = () => {
    setIsAddJobDialogOpen(true);
  };

  const canDelete = !hasSubfolders && !hasJobs;

  // Row heights and styling
  const desktopHeight = isTopLevel ? "min-h-14" : "min-h-12";
  const mobileHeight = isTopLevel ? "min-h-16" : "min-h-14";
  const rowBg = isTopLevel ? "bg-surface" : "";
  const topBorder = isTopLevel ? (isFirst ? "" : "border-t border-line") : "border-b border-line";

  return (
    <>
      {/* Desktop row (≥768px) */}
      <div
        className={`hidden md:flex items-stretch pl-3 ${topBorder} ${isPending ? "opacity-50" : ""} ${rowBg} hover:bg-surface/80 cursor-pointer transition-colors`}
        onClick={handleRowClick}
      >
        <TreeGuides depth={depth} />

        <div className={`flex-1 flex items-center min-w-0 ${desktopHeight} py-2`}>
          {/* Chevron or spacer - matches tree guide width */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            {hasContents ? (
              <svg
                className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Folder icon */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <svg className={`w-4 h-4 ${isEmpty ? "text-muted/50" : "text-muted"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0 pr-4 text-ink">
            <div className={`truncate ${isTopLevel ? "font-semibold text-base" : "font-medium"}`}>
              {folder.name}
            </div>
          </div>
        </div>

        {/* Status slot */}
        <div className="w-28 flex-shrink-0 flex items-center">
          {isEmpty ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface text-muted/60">
              Empty
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-1 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-complete rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={`text-xs tabular-nums ${allComplete ? "text-complete" : "text-muted"}`}>
                {complete} of {total}
              </span>
            </div>
          )}
        </div>

        {/* R-value spacer (jobs show R-value here) */}
        <div className="w-16 flex-shrink-0" />

        {/* Bags slot */}
        <div className="w-24 flex-shrink-0 flex items-center justify-end text-ink">
          {totalBags > 0 && (
            <span className="text-sm">
              <span className="font-semibold tabular-nums">{totalBags}</span>
              <span className="text-muted ml-1">bags</span>
            </span>
          )}
        </div>

        {/* Sqft slot */}
        <div className="w-28 flex-shrink-0 flex items-center justify-end text-ink">
          {totalSqft > 0 && (
            <span className="text-sm">
              <span className="tabular-nums">{totalSqft.toLocaleString()}</span>
              <span className="text-muted ml-1">sqft</span>
            </span>
          )}
        </div>

        {/* Action slot */}
        <div className="w-24 flex-shrink-0 flex items-center justify-end gap-0.5 pr-2" onClick={(e) => e.stopPropagation()}>
          <AddMenu
            onAddJob={handleAddJob}
            onAddSubfolder={() => setIsAddingUnit(true)}
            canAddSubfolder={depth < MAX_FOLDER_DEPTH - 1}
          />

          <RowMenu title={folder.name} subtitle={folder.area || undefined}>
            {isTopLevel && (
              <>
                <RowMenuItem
                  onClick={() => exportFolderPdf(folder)}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                >
                  Export PDF
                </RowMenuItem>
                <RowMenuDivider />
              </>
            )}
            <RowMenuItem
              onClick={() => setIsEditDialogOpen(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            >
              Edit folder
            </RowMenuItem>
            <RowMenuItem
              onClick={() => setIsMoveDialogOpen(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8m0 0l-3-3m3 3l-3 3" /></svg>}
            >
              Move folder
            </RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem
              onClick={handleDelete}
              disabled={!canDelete}
              hint={!canDelete ? "Has contents" : undefined}
              variant="danger"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            >
              Delete folder
            </RowMenuItem>
          </RowMenu>
        </div>
      </div>

      {/* Mobile row (<768px) */}
      <div
        className={`md:hidden flex items-stretch pl-3 ${topBorder} ${isPending ? "opacity-50" : ""} ${rowBg} active:bg-surface/80 cursor-pointer`}
        onClick={handleRowClick}
      >
        <TreeGuides depth={depth} isMobile />

        <div className={`flex-1 min-w-0 flex items-center ${mobileHeight} py-3`}>
          {/* Chevron or spacer - matches tree guide width */}
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            {hasContents ? (
              <svg
                className={`w-3.5 h-3.5 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-3.5" />
            )}
          </div>

          {/* Folder icon */}
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <svg className={`w-4 h-4 ${isEmpty ? "text-muted/50" : "text-muted"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0 pr-2 text-ink">
            <div className={`truncate ${isTopLevel ? "font-semibold" : "font-medium"}`}>
              {folder.name}
            </div>
            {isEmpty ? (
              <div className="text-xs text-muted">Empty</div>
            ) : (
              <div className="text-xs text-muted">
                {[
                  <span key="done">{complete} of {total} done</span>,
                  totalBags > 0 ? <span key="bags"><span className="font-semibold text-ink">{totalBags}</span> bags</span> : null,
                  totalSqft > 0 ? <span key="sqft">{totalSqft.toLocaleString()} sqft</span> : null,
                ].filter(Boolean).map((item, i, arr) => (
                  <span key={i}>{item}{i < arr.length - 1 ? <span className="mx-1.5">·</span> : ""}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex items-center gap-0.5 pr-2" onClick={(e) => e.stopPropagation()}>
          <AddMenu
            onAddJob={handleAddJob}
            onAddSubfolder={() => setIsAddingUnit(true)}
            canAddSubfolder={depth < MAX_FOLDER_DEPTH - 1}
          />

          <RowMenu title={folder.name} subtitle={folder.area || undefined}>
            {isTopLevel && (
              <>
                <RowMenuItem
                  onClick={() => exportFolderPdf(folder)}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                >
                  Export PDF
                </RowMenuItem>
                <RowMenuDivider />
              </>
            )}
            <RowMenuItem
              onClick={() => setIsEditDialogOpen(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            >
              Edit folder
            </RowMenuItem>
            <RowMenuItem
              onClick={() => setIsMoveDialogOpen(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8m0 0l-3-3m3 3l-3 3" /></svg>}
            >
              Move folder
            </RowMenuItem>
            <RowMenuDivider />
            <RowMenuItem
              onClick={handleDelete}
              disabled={!canDelete}
              hint={!canDelete ? "Has contents" : undefined}
              variant="danger"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            >
              Delete folder
            </RowMenuItem>
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
            placeholder="Folder name"
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

      <EditFolderDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        folder={folder}
      />

      <AddJobDialog
        open={isAddJobDialogOpen}
        onClose={() => setIsAddJobDialogOpen(false)}
        folder={folder}
      />

      <MoveDialog
        open={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        itemType="folder"
        itemId={folder.id}
        itemName={folder.name}
        currentFolderId={folder.parentId}
        folders={allFolders}
      />

      {/* Children */}
      {isExpanded && (
        <>
          {sortedJobs.map((job) => (
            <JobRow
              key={`job-${job.id}`}
              job={job}
              folder={folder}
              depth={depth + 1}
              lastRValue={lastRValue}
              onShowUndo={onShowUndo}
              allFolders={allFolders}
            />
          ))}
          {filteredChildren.map((child) => (
            <FolderRow
              key={child.id}
              folder={child}
              depth={depth + 1}
              filter={filter}
              searchQuery={searchQuery}
              lastRValue={lastRValue}
              undoState={undoState}
              onShowUndo={onShowUndo}
              isTopLevel={false}
              expandedFolders={expandedFolders}
              onToggleExpanded={onToggleExpanded}
              allFolders={allFolders}
            />
          ))}
        </>
      )}
    </>
  );
}

export function FolderTree({ folders, filter, searchQuery, lastRValue }: FolderTreeProps) {
  const [undoState, setUndoState] = useState<UndoState>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Helper to collect all descendant folder IDs
  const getDescendantIds = useCallback((folderId: string): Set<string> => {
    const descendants = new Set<string>();

    function findFolder(folders: FolderWithRelations[]): FolderWithRelations | null {
      for (const f of folders) {
        if (f.id === folderId) return f;
        const found = findFolder(f.children);
        if (found) return found;
      }
      return null;
    }

    function collectIds(folder: FolderWithRelations) {
      for (const child of folder.children) {
        descendants.add(child.id);
        collectIds(child);
      }
    }

    const folder = findFolder(folders);
    if (folder) collectIds(folder);
    return descendants;
  }, [folders]);

  const handleToggleExpanded = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        // Collapsing - also collapse all descendants
        newSet.delete(folderId);
        const descendantIds = getDescendantIds(folderId);
        descendantIds.forEach(id => newSet.delete(id));
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, [getDescendantIds]);

  const handleShowUndo = useCallback((jobId: number, previousStatus: JobStatus) => {
    setUndoState({ jobId, previousStatus });
  }, []);

  const handleDismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  const filteredFolders = folders
    .filter(
      (loc) =>
        hasMatchingDescendant(loc, filter) &&
        hasMatchingSearchDescendant(loc, searchQuery)
    )
    .sort((a, b) => naturalSort(a.name, b.name));

  if (filteredFolders.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        {searchQuery ? "No folders match your search" : "No folders match this filter"}
      </div>
    );
  }

  return (
    <>
      <div>
        {filteredFolders.map((folder, index) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            depth={0}
            filter={filter}
            searchQuery={searchQuery}
            lastRValue={lastRValue}
            undoState={undoState}
            onShowUndo={handleShowUndo}
            isTopLevel={true}
            isFirst={index === 0}
            expandedFolders={expandedFolders}
            onToggleExpanded={handleToggleExpanded}
            allFolders={folders}
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
