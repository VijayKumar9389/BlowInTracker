"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { Folder } from "@prisma/client";
import { updateFolder } from "@/app/jobs/actions";

type EditFolderDialogProps = {
  open: boolean;
  onClose: () => void;
  folder: Folder;
};

export function EditFolderDialog({ open, onClose, folder }: EditFolderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(folder.name);
  const [area, setArea] = useState(folder.area || "");

  useEffect(() => {
    if (open) {
      setName(folder.name);
      setArea(folder.area || "");
      setError(null);
    }
  }, [open, folder]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateFolder(folder.id, {
        name,
        area: area || null,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to update folder");
      }
    });
  };

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
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-ink">Edit folder</h2>
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

        <div className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-ink mb-1.5">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
            />
          </div>

          <div>
            <label htmlFor="edit-area" className="block text-sm text-ink mb-1.5">
              <span className="font-medium">Area</span>
              <span className="text-muted"> · optional</span>
            </label>
            <input
              id="edit-area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Main attic, Garage"
              className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full h-12 bg-ink text-white rounded-full font-medium disabled:opacity-50 hover:bg-ink/90 transition-opacity"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
