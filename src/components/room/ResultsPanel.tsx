"use client";

import { VoteResults } from "@/types";

interface ResultsPanelProps {
  results: VoteResults;
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  const { average, distribution } = results;
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="border-t border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Results</h3>
        {average !== null && (
          <div className="text-sm text-gray-300">
            Average: <span className="text-indigo-400 font-bold text-lg">{average}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-3 h-24">
        {entries.map(([value, count]) => (
          <div key={value} className="flex flex-col items-center gap-1 flex-1 max-w-[60px]">
            <span className="text-xs text-gray-400">{count}</span>
            <div
              className="w-full bg-indigo-600 rounded-t min-h-[4px] transition-all"
              style={{ height: `${(count / maxCount) * 100}%` }}
            />
            <span className="text-xs font-mono text-gray-300">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
