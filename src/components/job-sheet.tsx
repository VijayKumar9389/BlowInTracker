"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { JobStatus } from "@prisma/client";
import type { Job, Folder } from "@prisma/client";
import { updateJob, createJob } from "@/app/jobs/actions";

type JobSheetProps = {
  open: boolean;
  onClose: () => void;
  folder: Folder;
  job?: Job | null;
  mode?: "edit" | "complete";
  lastRValue?: number | null;
};

export function JobSheet({
  open,
  onClose,
  folder,
  job,
  mode = "edit",
  lastRValue,
}: JobSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [name, setName] = useState(job?.name || "");
  const [status, setStatus] = useState<JobStatus>(job?.status || "READY");
  const defaultRValue = job?.rValue || lastRValue || null;
  const [rValue, setRValue] = useState<number | "other" | null>(
    defaultRValue ? ([40, 50, 60].includes(defaultRValue) ? defaultRValue : "other") : null
  );
  const [customRValue, setCustomRValue] = useState<string>(
    defaultRValue && ![40, 50, 60].includes(defaultRValue) ? defaultRValue.toString() : ""
  );
  const [bags, setBags] = useState(job?.bags || 0);
  const [sqft, setSqft] = useState(job?.sqft?.toString() || "");

  const showLastRValueHint = !job?.rValue && lastRValue && rValue === lastRValue;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset form when job changes
  useEffect(() => {
    if (open) {
      const defaultR = job?.rValue || lastRValue || null;
      setName(job?.name || "");
      setStatus(job?.status || "READY");
      setRValue(defaultR ? ([40, 50, 60].includes(defaultR) ? defaultR : "other") : null);
      setCustomRValue(defaultR && ![40, 50, 60].includes(defaultR) ? defaultR.toString() : "");
      setBags(job?.bags || 0);
      setSqft(job?.sqft?.toString() || "");
    }
  }, [job, open, lastRValue]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsAnimating(true));
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const getFinalRValue = () => {
    if (rValue === "other") return parseInt(customRValue) || null;
    return rValue;
  };

  const handleSave = (saveAsComplete: boolean = false) => {
    if (!name.trim()) {
      alert("Job name is required");
      return;
    }

    startTransition(async () => {
      const finalRValue = getFinalRValue();
      const finalStatus = saveAsComplete ? "COMPLETE" : status;

      if (job) {
        const formData = new FormData();
        formData.set("name", name.trim());
        formData.set("folderId", folder.id);
        formData.set("status", finalStatus);
        if (finalRValue) formData.set("rValue", finalRValue.toString());
        formData.set("bags", bags.toString());
        if (sqft) formData.set("sqft", sqft);

        const result = await updateJob(job.id, formData);
        if (result.success) {
          onClose();
        } else {
          console.error("Update failed:", result.error);
          alert(result.error || "Failed to update job");
        }
      } else {
        const result = await createJob(folder.id, {
          name: name.trim(),
          status: finalStatus,
          rValue: finalRValue,
          bags: bags || null,
          sqft: sqft ? parseInt(sqft) : null,
        });
        if (result.success) onClose();
      }
    });
  };

  if (!open) return null;

  const statusOptions: { value: JobStatus; label: string }[] = [
    { value: "READY", label: "Ready" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "COMPLETE", label: "Complete" },
  ];

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">{job ? job.name : "New Job"}</h2>
          <p className="text-muted mt-0.5">{folder.name}{folder.area ? ` · ${folder.area}` : ""}</p>
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

      {/* Job Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-1.5">Job name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Unit 101, Main Attic"
          className="w-full h-11 px-4 bg-surface border border-line rounded-xl text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
        />
      </div>

      {/* Status - only in edit mode */}
      {mode === "edit" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3">Status</label>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`flex-1 min-h-11 rounded-xl text-sm font-medium transition-all ${
                  status === option.value
                    ? "bg-ink text-white"
                    : "bg-surface text-ink hover:bg-line"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* R-value */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-sm font-medium text-ink">R-value</label>
          {showLastRValueHint && (
            <span className="text-xs text-muted">same as last unit</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[40, 50, 60].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRValue(value)}
              className={`min-h-12 rounded-xl font-medium transition-all ${
                rValue === value
                  ? "bg-ink text-white"
                  : "bg-surface text-ink hover:bg-line"
              }`}
            >
              R{value}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRValue("other")}
            className={`min-h-12 rounded-xl font-medium transition-all ${
              rValue === "other"
                ? "bg-ink text-white"
                : "bg-surface text-ink hover:bg-line"
            }`}
          >
            Other
          </button>
        </div>
        {rValue === "other" && (
          <input
            type="number"
            inputMode="numeric"
            value={customRValue}
            onChange={(e) => setCustomRValue(e.target.value)}
            placeholder="Enter R-value"
            min="1"
            autoFocus
            className="w-full h-12 px-4 mt-3 bg-surface border border-line rounded-xl text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
        )}
      </div>

      {/* Bags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-3">Bags</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={bags}
            onChange={(e) => setBags(Math.max(0, parseInt(e.target.value) || 0))}
            onFocus={(e) => e.target.select()}
            min="0"
            className="flex-1 h-14 px-4 text-2xl font-semibold text-center bg-surface border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setBags(Math.max(0, bags - 1))}
            className="flex-1 min-h-11 rounded-xl bg-surface text-ink font-medium hover:bg-line transition-colors"
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => setBags(bags + 1)}
            className="flex-1 min-h-11 rounded-xl bg-surface text-ink font-medium hover:bg-line transition-colors"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => setBags(bags + 5)}
            className="flex-1 min-h-11 rounded-xl bg-surface text-ink font-medium hover:bg-line transition-colors"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => setBags(bags + 10)}
            className="flex-1 min-h-11 rounded-xl bg-surface text-ink font-medium hover:bg-line transition-colors"
          >
            +10
          </button>
        </div>
      </div>

      {/* Sqft */}
      <div className="mb-6">
        <label className="block text-sm text-ink mb-3">
          <span className="font-medium">Sqft</span>
          <span className="text-muted"> · optional</span>
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            placeholder="Add later if you don't know"
            min="1"
            className="w-full h-12 px-4 pr-14 bg-surface border border-line rounded-xl text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">sqft</span>
        </div>
      </div>
    </>
  );

  const footer = (
    <>
      {mode === "complete" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="w-full h-14 bg-ink text-white rounded-2xl font-medium text-lg hover:bg-ink/90 disabled:opacity-50 transition-all"
          >
            {isPending ? "Saving..." : `Complete · ${bags} bags`}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="w-full text-muted hover:text-ink transition-colors text-sm"
          >
            Save, keep in progress
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="w-full h-14 bg-ink text-white rounded-2xl font-medium text-lg hover:bg-ink/90 disabled:opacity-50 transition-all"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      )}
    </>
  );

  // Mobile: full-height bottom sheet
  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <div
          ref={sheetRef}
          className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] transition-transform duration-200 ease-out ${
            isAnimating ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-line rounded-full" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{content}</div>
          <div className="p-5 pt-0 bg-white border-t border-line">{footer}</div>
        </div>
      </>
    );
  }

  // Desktop: centered dialog
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ease-out ${
            isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="flex-1 overflow-y-auto p-6">{content}</div>
          <div className="p-6 pt-0">{footer}</div>
        </div>
      </div>
    </>
  );
}
