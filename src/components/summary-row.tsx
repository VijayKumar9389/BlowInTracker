import type { Job } from "@prisma/client";
import type { FilterType } from "@/lib/types";

type SummaryRowProps = {
  jobs: Job[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
};

export function SummaryRow({ jobs, filter, onFilterChange }: SummaryRowProps) {
  const totalJobs = jobs.length;
  const waitingJobs = jobs.filter((j) => j.status === "WAITING").length;
  const readyJobs = jobs.filter((j) => j.status === "READY").length;
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE").length;

  const getButtonClass = (filterValue: FilterType) => {
    const isActive = filter === filterValue;
    return `p-4 text-center transition-colors cursor-pointer ${
      isActive ? "bg-ink text-white" : "hover:bg-surface"
    }`;
  };

  const getNumberClass = (filterValue: FilterType) => {
    const isActive = filter === filterValue;
    return `text-2xl font-semibold tabular-nums ${isActive ? "text-white" : "text-ink"}`;
  };

  const getLabelClass = (filterValue: FilterType) => {
    const isActive = filter === filterValue;
    return `text-xs mt-1 ${isActive ? "text-white/70" : "text-muted"}`;
  };

  return (
    <div className="border border-line rounded-2xl mb-6 overflow-hidden">
      {/* Mobile: Total as hero row, then 2x2 grid */}
      <div className="md:hidden">
        {/* Total - hero stat */}
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`w-full p-4 text-center border-b border-line transition-colors cursor-pointer ${
            filter === "all" ? "bg-ink text-white" : "bg-surface/50 hover:bg-surface"
          }`}
        >
          <div className={`text-3xl font-semibold tabular-nums ${filter === "all" ? "text-white" : "text-ink"}`}>
            {totalJobs || "—"}
          </div>
          <div className={`text-xs mt-1 ${filter === "all" ? "text-white/70" : "text-muted"}`}>
            All jobs
          </div>
        </button>

        {/* Status breakdown - 2x2 grid */}
        <div className="grid grid-cols-2 divide-x divide-line">
          <button type="button" onClick={() => onFilterChange("waiting")} className={getButtonClass("waiting")}>
            <div className={getNumberClass("waiting")}>{waitingJobs || "—"}</div>
            <div className={getLabelClass("waiting")}>Waiting</div>
          </button>
          <button type="button" onClick={() => onFilterChange("ready")} className={getButtonClass("ready")}>
            <div className={getNumberClass("ready")}>{readyJobs || "—"}</div>
            <div className={getLabelClass("ready")}>Ready</div>
          </button>
          <button type="button" onClick={() => onFilterChange("in_progress")} className={`${getButtonClass("in_progress")} border-t border-line`}>
            <div className={getNumberClass("in_progress")}>{inProgressJobs || "—"}</div>
            <div className={getLabelClass("in_progress")}>In progress</div>
          </button>
          <button type="button" onClick={() => onFilterChange("complete")} className={`${getButtonClass("complete")} border-t border-line`}>
            <div className={getNumberClass("complete")}>{completeJobs || "—"}</div>
            <div className={getLabelClass("complete")}>Complete</div>
          </button>
        </div>
      </div>

      {/* Desktop: 5 columns in one row */}
      <div className="hidden md:grid md:grid-cols-5 divide-x divide-line">
        <button type="button" onClick={() => onFilterChange("all")} className={getButtonClass("all")}>
          <div className={getNumberClass("all")}>{totalJobs || "—"}</div>
          <div className={getLabelClass("all")}>All</div>
        </button>
        <button type="button" onClick={() => onFilterChange("waiting")} className={getButtonClass("waiting")}>
          <div className={getNumberClass("waiting")}>{waitingJobs || "—"}</div>
          <div className={getLabelClass("waiting")}>Waiting</div>
        </button>
        <button type="button" onClick={() => onFilterChange("ready")} className={getButtonClass("ready")}>
          <div className={getNumberClass("ready")}>{readyJobs || "—"}</div>
          <div className={getLabelClass("ready")}>Ready</div>
        </button>
        <button type="button" onClick={() => onFilterChange("in_progress")} className={getButtonClass("in_progress")}>
          <div className={getNumberClass("in_progress")}>{inProgressJobs || "—"}</div>
          <div className={getLabelClass("in_progress")}>In progress</div>
        </button>
        <button type="button" onClick={() => onFilterChange("complete")} className={getButtonClass("complete")}>
          <div className={getNumberClass("complete")}>{completeJobs || "—"}</div>
          <div className={getLabelClass("complete")}>Complete</div>
        </button>
      </div>
    </div>
  );
}
