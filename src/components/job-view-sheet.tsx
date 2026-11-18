"use client";

import { useState, useEffect, useRef } from "react";
import type { Job, Location } from "@prisma/client";

type JobViewSheetProps = {
  open: boolean;
  onClose: () => void;
  location: Location;
  job: Job;
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function JobViewSheet({
  open,
  onClose,
  location,
  job,
}: JobViewSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  if (!open) return null;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">{location.name}</h2>
          {location.area && <p className="text-muted mt-0.5">{location.area}</p>}
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

      {/* Completion badge */}
      <div className="mb-6 p-4 bg-complete/10 rounded-xl">
        <div className="flex items-center gap-2 text-complete font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Completed
        </div>
        <p className="text-sm text-muted mt-1">{formatDate(job.completedAt)}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* R-value */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-muted mb-1">R-value</p>
          <p className="text-2xl font-semibold text-ink">
            {job.rValue ? `R${job.rValue}` : "—"}
          </p>
        </div>

        {/* Bags */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-muted mb-1">Bags</p>
          <p className="text-2xl font-semibold text-ink">
            {job.bags ?? "—"}
          </p>
        </div>

        {/* Sqft */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-muted mb-1">Sqft</p>
          <p className="text-2xl font-semibold text-ink">
            {job.sqft?.toLocaleString() ?? "—"}
          </p>
        </div>
      </div>

      {/* Bags per sqft if both values exist */}
      {job.bags && job.sqft && (
        <div className="bg-surface rounded-xl p-4 mb-6">
          <p className="text-sm text-muted mb-1">Bags per 100 sqft</p>
          <p className="text-2xl font-semibold text-ink">
            {((job.bags / job.sqft) * 100).toFixed(1)}
          </p>
        </div>
      )}
    </>
  );

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="w-full h-14 bg-ink text-white rounded-2xl font-medium text-lg hover:bg-ink/90 transition-all"
    >
      Done
    </button>
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
