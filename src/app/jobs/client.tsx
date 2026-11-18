"use client";

import { useState } from "react";
import type { LocationWithRelations, FilterType, Job } from "@/lib/types";
import { LocationTree } from "@/components/location-tree";
import { SummaryRow } from "@/components/summary-row";
import { FilterTabs } from "@/components/filter-tabs";
import { SearchInput } from "@/components/search-input";
import { AddLocation } from "@/components/add-location";
import { Header } from "@/components/header";

type JobsPageClientProps = {
  locations: LocationWithRelations[];
  jobs: Job[];
  counts: Record<FilterType, number>;
  lastRValue: number | null;
};

export function JobsPageClient({
  locations,
  jobs,
  counts,
  lastRValue,
}: JobsPageClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-ink">Jobs</h1>
          <AddLocation />
        </div>

        <SummaryRow jobs={jobs} />

        <div className="space-y-4 mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search locations..."
          />
          <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        </div>

        <LocationTree
          locations={locations}
          filter={filter}
          searchQuery={searchQuery}
          lastRValue={lastRValue}
        />
      </main>
    </div>
  );
}
