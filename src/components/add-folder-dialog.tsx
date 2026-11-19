"use client";

import { useState, useEffect, useTransition } from "react";
import { createFolder } from "@/app/jobs/actions";
import { Dialog } from "./dialog";

type AddFolderDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddFolderDialog({ open, onClose }: AddFolderDialogProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setArea("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      if (area.trim()) {
        formData.set("area", area.trim());
      }
      const result = await createFolder(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to create folder");
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="New folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="folder-name" className="block text-sm font-medium text-ink mb-1.5">
            Name
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 123 Main Street"
            autoFocus
            className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
        </div>

        <div>
          <label htmlFor="folder-area" className="block text-sm text-ink mb-1.5">
            <span className="font-medium">Area</span>
            <span className="text-muted"> · optional</span>
          </label>
          <input
            id="folder-area"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Main attic"
            className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
        </div>

        {error && (
          <div className="text-sm text-danger bg-red-50 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full h-12 bg-ink text-white rounded-full font-medium disabled:opacity-50 hover:bg-ink/90 transition-opacity"
          >
            {isPending ? "Creating..." : "Create folder"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
