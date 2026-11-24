import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const totalJobs = jobs.length;
  const todoJobs = jobs.filter((j) => j.status === "READY" || j.status === "IN_PROGRESS").length;
  const waitingJobs = jobs.filter((j) => j.status === "WAITING").length;
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;

  return (
    <div className="border border-line rounded-2xl mb-6 overflow-hidden">
      {/* Mobile: Total as hero row, then 2x2 grid */}
      <div className="md:hidden">
        {/* Total - hero stat */}
        <div className="p-4 text-center border-b border-line bg-surface/50">
          <div className="text-3xl font-semibold text-ink tabular-nums">
            {totalJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Total jobs</div>
        </div>

        {/* Status breakdown - 2x2 grid */}
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-4 text-center">
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {waitingJobs || "—"}
            </div>
            <div className="text-xs text-muted mt-1">Waiting</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {todoJobs || "—"}
            </div>
            <div className="text-xs text-muted mt-1">To do</div>
          </div>
          <div className="p-4 text-center border-t border-line">
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {inProgressJobs || "—"}
            </div>
            <div className="text-xs text-muted mt-1">In progress</div>
          </div>
          <div className="p-4 text-center border-t border-line">
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {completeJobs || "—"}
            </div>
            <div className="text-xs text-muted mt-1">Complete</div>
          </div>
        </div>
      </div>

      {/* Desktop: 5 columns in one row */}
      <div className="hidden md:grid md:grid-cols-5 divide-x divide-line">
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Total</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {waitingJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Waiting</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {todoJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">To do</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {inProgressJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">In progress</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {completeJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Complete</div>
        </div>
      </div>
    </div>
  );
}
