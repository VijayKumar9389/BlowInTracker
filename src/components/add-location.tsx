"use client";

import { useState, useTransition } from "react";
import { createLocation } from "@/app/jobs/actions";
import { Dialog } from "./dialog";

export function AddLocation() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      if (area.trim()) {
        formData.set("area", area.trim());
      }
      const result = await createLocation(formData);
      if (result.success) {
        setIsOpen(false);
        setName("");
        setArea("");
        setError(null);
      } else {
        setError(result.error || "Failed to create location");
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setName("");
    setArea("");
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="min-h-11 px-5 border border-line rounded-full text-sm text-muted hover:border-ink hover:text-ink transition-colors"
      >
        + Add location
      </button>

      <Dialog open={isOpen} onClose={handleClose} title="Add location">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="location-name" className="block text-sm text-muted mb-1.5">
              Name
            </label>
            <input
              id="location-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 123 Main Street"
              autoFocus
              className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
            />
          </div>

          <div>
            <label htmlFor="location-area" className="block text-sm text-muted mb-1.5">
              Area <span className="opacity-50">(optional)</span>
            </label>
            <input
              id="location-area"
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="flex-1 h-11 bg-ink text-white rounded-full font-medium disabled:opacity-50 hover:bg-ink/90 transition-opacity"
            >
              {isPending ? "Adding..." : "Add location"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="h-11 px-6 text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
