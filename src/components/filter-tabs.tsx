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
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`min-h-11 px-4 rounded-full text-sm font-medium transition-colors ${
            value === filter.value
              ? "bg-ink text-white"
              : "bg-surface text-muted hover:bg-line hover:text-ink"
          }`}
        >
          {filter.label}
          <span className="ml-1.5 opacity-70">{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  );
}
