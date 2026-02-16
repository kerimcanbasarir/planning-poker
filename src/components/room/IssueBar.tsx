"use client";

import { useState } from "react";
import { useRoomContext } from "@/context/RoomContext";

interface IssueBarProps {
  currentIssue: string;
  isCreator: boolean;
}

export default function IssueBar({ currentIssue, isCreator }: IssueBarProps) {
  const { setIssue } = useRoomContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentIssue);

  const handleSave = () => {
    setIssue(draft);
    setEditing(false);
  };

  if (editing && isCreator) {
    return (
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <input
          autoFocus
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="Enter issue/story title..."
          maxLength={200}
        />
        <button
          onClick={handleSave}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-sm text-gray-500 hover:text-gray-400"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-b border-gray-800 px-6 py-3 flex items-center gap-2 ${
        isCreator ? "cursor-pointer hover:bg-gray-800/50" : ""
      }`}
      onClick={() => {
        if (isCreator) {
          setDraft(currentIssue);
          setEditing(true);
        }
      }}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wider">Issue:</span>
      <span className="text-sm text-gray-200">
        {currentIssue || (isCreator ? "Click to set issue..." : "No issue set")}
      </span>
    </div>
  );
}
