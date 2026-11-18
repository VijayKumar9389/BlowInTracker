import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const todoJobs = jobs.filter((j) => j.status === "READY" || j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;
  const totalJobs = jobs.length;
  const totalBags = jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  const totalSqft = jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);

  // Calculate bags per sqft only for jobs that have both bags and sqft
  const jobsWithBothMetrics = jobs.filter((j) => j.bags && j.sqft);
  const bagsWithSqft = jobsWithBothMetrics.reduce((sum, j) => sum + (j.bags || 0), 0);
  const sqftWithBags = jobsWithBothMetrics.reduce((sum, j) => sum + (j.sqft || 0), 0);
  const bagsPerHundredSqft = sqftWithBags > 0 ? ((bagsWithSqft / sqftWithBags) * 100).toFixed(1) : null;

  return (
    <div className="border border-line rounded-2xl mb-6 overflow-hidden">
      <div className="grid grid-cols-3 md:grid-cols-5 divide-x divide-line">
        {/* To do */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {todoJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">To do</div>
        </div>

        {/* Complete - hidden on mobile */}
        <div className="hidden md:block p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalJobs > 0 ? `${completeJobs} of ${totalJobs}` : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Complete</div>
        </div>

        {/* Bags */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalBags > 0 ? totalBags.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Bags</div>
        </div>

        {/* Sqft - hidden on mobile */}
        <div className="hidden md:block p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalSqft > 0 ? totalSqft.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Sqft</div>
        </div>

        {/* Bags/100sqft */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {bagsPerHundredSqft || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Bags / 100 sqft</div>
        </div>
      </div>
    </div>
  );
}
