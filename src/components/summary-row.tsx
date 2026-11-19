import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const todoJobs = jobs.filter((j) => j.status === "READY" || j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;
  const totalBags = jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  const totalSqft = jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);

  return (
    <div className="border border-line rounded-2xl mb-6 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
        {/* To do */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {todoJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">To do</div>
        </div>

        {/* Jobs recorded */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {completeJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Jobs recorded</div>
        </div>

        {/* Bags recorded */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalBags > 0 ? totalBags.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Bags recorded</div>
        </div>

        {/* Sqft recorded */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalSqft > 0 ? totalSqft.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Sqft recorded</div>
        </div>
      </div>
    </div>
  );
}
