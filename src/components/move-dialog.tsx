"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import type { FolderWithRelations } from "@/lib/types";
import { moveJob, moveFolder } from "@/app/jobs/actions";
import { MAX_FOLDER_DEPTH } from "@/lib/constants";

type MoveDialogProps = {
  open: boolean;
  onClose: () => void;
  itemType: "job" | "folder";
  itemId: number | string;
  itemName: string;
  currentFolderId: string | null;
  folders: FolderWithRelations[];
};

type FlatFolder = {
  id: string;
  name: string;
  depth: number;
  disabled: boolean;
  disabledReason?: string;
  isCurrent: boolean;
};

function flattenFolders(
  folders: FolderWithRelations[],
  depth: number = 0,
  currentFolderId: string | null,
  itemType: "job" | "folder",
  itemId: string | null, // For folders, to check descendants
  itemSubtreeDepth: number // For folders, the depth of children
): FlatFolder[] {
  const result: FlatFolder[] = [];

  for (const folder of folders) {
    let disabled = false;
    let disabledReason: string | undefined;
    const isCurrent = folder.id === currentFolderId;

    if (itemType === "folder" && itemId) {
      // Can't move folder into itself
      if (folder.id === itemId) {
        disabled = true;
        disabledReason = "Cannot move into itself";
      }
      // Check if this folder is a descendant of the item being moved
      else if (isDescendantOfFolder(folder, itemId)) {
        disabled = true;
        disabledReason = "Cannot move into subfolder";
      }
      // Check depth constraint
      else if (depth + 1 + itemSubtreeDepth > MAX_FOLDER_DEPTH) {
        disabled = true;
        disabledReason = "Would exceed max depth";
      }
    }

    result.push({
      id: folder.id,
      name: folder.name,
      depth,
      disabled,
      disabledReason,
      isCurrent,
    });

    if (folder.children.length > 0) {
      result.push(
        ...flattenFolders(
          folder.children,
          depth + 1,
          currentFolderId,
          itemType,
          itemId,
          itemSubtreeDepth
        )
      );
    }
  }

  return result;
}

function isDescendantOfFolder(folder: FolderWithRelations, ancestorId: string): boolean {
  // Check if this folder or any of its ancestors is the ancestorId
  // We need to check if folder is a descendant by looking through the tree
  // Since we're iterating top-down, we track if we're inside the item's subtree
  return checkDescendant(folder, ancestorId);
}

function checkDescendant(folder: FolderWithRelations, targetId: string): boolean {
  if (folder.id === targetId) return true;
  for (const child of folder.children) {
    if (checkDescendant(child, targetId)) return true;
  }
  return false;
}

function getSubtreeDepth(folder: FolderWithRelations): number {
  if (!folder.children || folder.children.length === 0) return 0;
  return 1 + Math.max(...folder.children.map(getSubtreeDepth));
}

function findFolderById(folders: FolderWithRelations[], id: string): FolderWithRelations | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderById(folder.children, id);
    if (found) return found;
  }
  return null;
}

// Build a map to track which folders are descendants of a given folder
function buildDescendantMap(folders: FolderWithRelations[], targetId: string): Set<string> {
  const descendants = new Set<string>();

  function collectDescendants(folder: FolderWithRelations) {
    for (const child of folder.children) {
      descendants.add(child.id);
      collectDescendants(child);
    }
  }

  const targetFolder = findFolderById(folders, targetId);
  if (targetFolder) {
    collectDescendants(targetFolder);
  }

  return descendants;
}

export function MoveDialog({
  open,
  onClose,
  itemType,
  itemId,
  itemName,
  currentFolderId,
  folders,
}: MoveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // For folder moves, calculate the subtree depth
  const itemSubtreeDepth = useMemo(() => {
    if (itemType === "folder" && typeof itemId === "string") {
      const folder = findFolderById(folders, itemId);
      return folder ? getSubtreeDepth(folder) : 0;
    }
    return 0;
  }, [itemType, itemId, folders]);

  // Build set of descendant IDs for the folder being moved
  const descendantIds = useMemo(() => {
    if (itemType === "folder" && typeof itemId === "string") {
      return buildDescendantMap(folders, itemId);
    }
    return new Set<string>();
  }, [itemType, itemId, folders]);

  // Flatten folders with disabled states
  const flatFolders = useMemo(() => {
    const itemIdStr = itemType === "folder" ? String(itemId) : null;

    const result: FlatFolder[] = [];

    function processFolder(folder: FolderWithRelations, depth: number) {
      let disabled = false;
      let disabledReason: string | undefined;
      const isCurrent = folder.id === currentFolderId;

      if (itemType === "folder" && itemIdStr) {
        if (folder.id === itemIdStr) {
          disabled = true;
          disabledReason = "Cannot move into itself";
        } else if (descendantIds.has(folder.id)) {
          disabled = true;
          disabledReason = "Cannot move into subfolder";
        } else if (depth + 1 + itemSubtreeDepth > MAX_FOLDER_DEPTH) {
          disabled = true;
          disabledReason = "Would exceed max depth";
        }
      }

      result.push({
        id: folder.id,
        name: folder.name,
        depth,
        disabled,
        disabledReason,
        isCurrent,
      });

      for (const child of folder.children) {
        processFolder(child, depth + 1);
      }
    }

    for (const folder of folders) {
      processFolder(folder, 0);
    }

    return result;
  }, [folders, currentFolderId, itemType, itemId, itemSubtreeDepth, descendantIds]);

  useEffect(() => {
    if (open) {
      setSelectedFolderId(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => dialog.close(), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleMove = () => {
    if (selectedFolderId === null && itemType === "job") {
      setError("Please select a folder");
      return;
    }

    startTransition(async () => {
      let result;
      if (itemType === "job") {
        result = await moveJob(itemId as number, selectedFolderId!);
      } else {
        result = await moveFolder(itemId as string, selectedFolderId);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to move");
      }
    });
  };

  const canMove = itemType === "folder"
    ? selectedFolderId !== currentFolderId // For folders, allow moving to root (null)
    : selectedFolderId !== null && selectedFolderId !== currentFolderId;

  return (
    <dialog
      ref={dialogRef}
      className={`
        fixed inset-0 m-auto w-full max-w-md p-0 rounded-2xl bg-white shadow-2xl
        transition-all duration-200 ease-out
        ${isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        backdrop:transition-opacity backdrop:duration-200
        ${isAnimating ? "backdrop:opacity-100" : "backdrop:opacity-0"}
      `}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              Move {itemType}
            </h2>
            <p className="text-sm text-muted mt-0.5">{itemName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-ink transition-colors -mr-2 -mt-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto -mx-2 px-2">
          {/* Move to root option (only for folders) */}
          {itemType === "folder" && (
            <>
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors
                  ${selectedFolderId === null && currentFolderId !== null
                    ? "bg-ink text-white"
                    : currentFolderId === null
                      ? "bg-surface text-muted cursor-default"
                      : "hover:bg-surface text-ink"
                  }
                `}
                disabled={currentFolderId === null}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Root level</span>
                {currentFolderId === null && (
                  <span className="text-xs text-muted ml-auto">(current)</span>
                )}
              </button>
              <div className="border-b border-line my-2" />
            </>
          )}

          {/* Folder list */}
          {flatFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => !folder.disabled && !folder.isCurrent && setSelectedFolderId(folder.id)}
              disabled={folder.disabled || folder.isCurrent}
              title={folder.disabledReason}
              className={`
                w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors
                ${selectedFolderId === folder.id
                  ? "bg-ink text-white"
                  : folder.disabled
                    ? "text-muted/50 cursor-not-allowed"
                    : folder.isCurrent
                      ? "bg-surface text-muted cursor-default"
                      : "hover:bg-surface text-ink"
                }
              `}
              style={{ paddingLeft: `${12 + folder.depth * 20}px` }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className={folder.disabled ? "" : "font-medium"}>{folder.name}</span>
              {folder.isCurrent && (
                <span className="text-xs text-muted ml-auto">(current)</span>
              )}
              {folder.disabled && folder.disabledReason && (
                <span className="text-xs ml-auto">{folder.disabledReason}</span>
              )}
            </button>
          ))}

          {flatFolders.length === 0 && (
            <div className="text-center text-muted py-8">
              No folders available
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-danger bg-red-50 px-4 py-3 rounded-xl mt-4">
            {error}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleMove}
            disabled={!canMove || isPending}
            className="w-full h-12 bg-ink text-white rounded-full font-medium disabled:opacity-50 hover:bg-ink/90 transition-opacity"
          >
            {isPending ? "Moving..." : "Move here"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
