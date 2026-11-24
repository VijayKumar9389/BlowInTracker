"use client";

import { useState } from "react";
import type { FolderWithRelations, FilterType, Job } from "@/lib/types";
import { FolderTree } from "@/components/folder-tree";
import { SummaryRow } from "@/components/summary-row";
import { SearchInput } from "@/components/search-input";
import { Header } from "@/components/header";
import { AddFolderDialog } from "@/components/add-folder-dialog";

type JobsPageClientProps = {
  folders: FolderWithRelations[];
  jobs: Job[];
  lastRValue: number | null;
};

export function JobsPageClient({
  folders,
  jobs,
  lastRValue,
}: JobsPageClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:pt-8 sm:pb-40">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Jobs</h1>
          <button
            type="button"
            onClick={() => setShowFolderDialog(true)}
            className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium text-white bg-ink rounded-full hover:bg-ink/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New folder
          </button>
        </div>

        {/* Summary with filters */}
        <SummaryRow jobs={jobs} filter={filter} onFilterChange={setFilter} />

        {/* Search */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Tree container */}
        <div className="border border-line">
          <FolderTree
            folders={folders}
            filter={filter}
            searchQuery={searchQuery}
            lastRValue={lastRValue}
          />
        </div>
      </main>

      <AddFolderDialog
        open={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
      />
    </div>
  );
}
