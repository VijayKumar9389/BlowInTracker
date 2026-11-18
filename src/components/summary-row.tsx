import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const readyJobs = jobs.filter((j) => j.status === "READY").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;
  const totalBags = jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  const totalSqft = jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);

  // Calculate bags per sqft only for jobs that have both bags and sqft
  const jobsWithBothMetrics = jobs.filter((j) => j.bags && j.sqft);
  const bagsWithSqft = jobsWithBothMetrics.reduce((sum, j) => sum + (j.bags || 0), 0);
  const sqftWithBags = jobsWithBothMetrics.reduce((sum, j) => sum + (j.sqft || 0), 0);
  const bagsPerHundredSqft = sqftWithBags > 0 ? ((bagsWithSqft / sqftWithBags) * 100).toFixed(1) : null;

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <div className="bg-surface rounded-xl p-4 text-center">
        <div className="text-3xl font-semibold text-ready tabular-nums">
          {readyJobs || "—"}
        </div>
        <div className="text-xs text-muted mt-1 uppercase tracking-wide">Ready</div>
      </div>
      <div className="bg-surface rounded-xl p-4 text-center">
        <div className="text-3xl font-semibold text-complete tabular-nums">
          {completeJobs || "—"}
        </div>
        <div className="text-xs text-muted mt-1 uppercase tracking-wide">Complete</div>
      </div>
      <div className="bg-surface rounded-xl p-4 text-center">
        <div className="text-3xl font-semibold text-ink tabular-nums">
          {totalBags > 0 ? totalBags.toLocaleString() : "—"}
        </div>
        <div className="text-xs text-muted mt-1 uppercase tracking-wide">Bags</div>
      </div>
      <div className="bg-surface rounded-xl p-4 text-center">
        <div className="text-3xl font-semibold text-ink tabular-nums">
          {totalSqft > 0 ? totalSqft.toLocaleString() : "—"}
        </div>
        <div className="text-xs text-muted mt-1 uppercase tracking-wide">Sqft</div>
      </div>
      <div className="bg-surface rounded-xl p-4 text-center">
        <div className="text-3xl font-semibold text-ink tabular-nums">
          {bagsPerHundredSqft || "—"}
        </div>
        <div className="text-xs text-muted mt-1 uppercase tracking-wide">Bags/100sqft</div>
      </div>
    </div>
  );
}
