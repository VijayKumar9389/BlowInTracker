import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const waitingJobs = jobs.filter((j) => j.status === "WAITING" || j.status === "READY").length;
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;
  const totalBags = jobs.reduce((sum, j) => sum + (j.bags || 0), 0);
  const totalSqft = jobs.reduce((sum, j) => sum + (j.sqft || 0), 0);

  return (
    <div className="border border-line rounded-2xl mb-6 overflow-hidden">
      <div className="grid grid-cols-3 md:grid-cols-5 divide-x divide-line">
        {/* Waiting */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {waitingJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Waiting</div>
        </div>

        {/* In progress */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {inProgressJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">In progress</div>
        </div>

        {/* Complete */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {completeJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Complete</div>
        </div>

        {/* Bags recorded */}
        <div className="p-4 text-center border-t border-line md:border-t-0">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalBags > 0 ? totalBags.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Bags</div>
        </div>

        {/* Sqft recorded */}
        <div className="p-4 text-center border-t border-line md:border-t-0">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalSqft > 0 ? totalSqft.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Sqft</div>
        </div>
      </div>
    </div>
  );
}
