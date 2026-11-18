"use client";

import type { FilterType } from "@/lib/types";

type FilterTabsProps = {
  value: FilterType;
  onChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
};

const filters: { value: FilterType; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "complete", label: "Complete" },
  { value: "all", label: "All" },
];

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <div className="inline-flex bg-surface rounded-full p-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`h-9 px-4 rounded-full text-sm font-medium transition-all ${
            value === filter.value
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          {filter.label}
          <span className="ml-1.5 tabular-nums opacity-60">{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  );
}
