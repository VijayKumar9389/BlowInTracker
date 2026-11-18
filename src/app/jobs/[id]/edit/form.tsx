"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import { updateJob } from "@/app/jobs/actions";

type EditJobFormProps = {
  job: Job;
};

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: "READY", label: "Ready" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETE", label: "Complete" },
];

const rValueQuickPicks = [40, 50, 60];

export function EditJobForm({ job }: EditJobFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>(job.name);
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [rValue, setRValue] = useState<string>(job.rValue?.toString() || "");
  const [bags, setBags] = useState<number>(job.bags || 0);
  const [sqft, setSqft] = useState<string>(job.sqft?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Job name is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("folderId", job.folderId);
      formData.set("status", status);
      if (rValue) formData.set("rValue", rValue);
      formData.set("bags", bags.toString());
      if (sqft) formData.set("sqft", sqft);

      const result = await updateJob(job.id, formData);
      if (result.success) {
        router.push(`/jobs/${job.id}`);
      } else {
        setError(result.error || "Failed to update job");
      }
    });
  };

  const handleRValueQuickPick = (value: number) => {
    setRValue(value.toString());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Job Name */}
      <div>
        <label className="block text-sm text-muted mb-2">Job name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Unit 101, Main Attic"
          className="w-full h-11 px-4 border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm text-muted mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`min-h-11 px-5 rounded-full text-sm font-medium transition-colors ${
                status === option.value
                  ? "bg-ink text-white"
                  : "border border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* R-value */}
      <div>
        <label className="block text-sm text-muted mb-2">R-value</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {rValueQuickPicks.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRValueQuickPick(value)}
              className={`min-h-11 px-5 rounded-full text-sm font-medium transition-colors ${
                rValue === value.toString()
                  ? "bg-ink text-white"
                  : "border border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              R{value}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={rValue}
          onChange={(e) => setRValue(e.target.value)}
          placeholder="Custom R-value"
          min="1"
          className="w-full h-11 px-4 border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
        />
      </div>

      {/* Bags stepper */}
      <div>
        <label className="block text-sm text-muted mb-2">Bags</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setBags(Math.max(0, bags - 1))}
            className="min-w-11 min-h-11 flex items-center justify-center border border-line rounded-full text-ink hover:border-ink transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <input
            type="number"
            value={bags}
            onChange={(e) => setBags(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            className="w-24 h-11 px-4 text-center border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
          <button
            type="button"
            onClick={() => setBags(bags + 1)}
            className="min-w-11 min-h-11 flex items-center justify-center border border-line rounded-full text-ink hover:border-ink transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Sqft */}
      <div>
        <label className="block text-sm text-muted mb-2">
          Square feet <span className="opacity-50">(optional)</span>
        </label>
        <input
          type="number"
          value={sqft}
          onChange={(e) => setSqft(e.target.value)}
          placeholder="Enter sqft"
          min="1"
          className="w-full h-11 px-4 border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 bg-ink text-white rounded-full font-medium hover:bg-ink/90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 px-6 text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
