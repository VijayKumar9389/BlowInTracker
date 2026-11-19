"use client";

import type { FilterType } from "@/lib/types";

type FilterTabsProps = {
  value: FilterType;
  onChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
};

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "complete", label: "Complete" },
];

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex w-full sm:w-auto sm:inline-flex bg-surface rounded-full p-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`flex-1 sm:flex-initial h-8 px-4 rounded-full text-sm font-medium transition-colors ${
            value === filter.value
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          {filter.label}
          <span className={`ml-1.5 tabular-nums ${value === filter.value ? "opacity-70" : "opacity-60"}`}>{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  );
}
