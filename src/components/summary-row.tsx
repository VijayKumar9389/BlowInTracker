import type { Job } from "@prisma/client";

type SummaryRowProps = {
  jobs: Job[];
};

export function SummaryRow({ jobs }: SummaryRowProps) {
  const todoJobs = jobs.filter((j) => j.status === "READY" || j.status === "IN_PROGRESS").length;
  const waitingJobs = jobs.filter((j) => j.status === "WAITING").length;
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;

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

        {/* Waiting */}
        <div className="p-4 text-center">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {waitingJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Waiting</div>
        </div>

        {/* In progress */}
        <div className="p-4 text-center border-t border-line md:border-t-0">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {inProgressJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">In progress</div>
        </div>

        {/* Complete */}
        <div className="p-4 text-center border-t border-line md:border-t-0">
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {completeJobs || "—"}
          </div>
          <div className="text-xs text-muted mt-1">Complete</div>
        </div>
      </div>
    </div>
  );
}
