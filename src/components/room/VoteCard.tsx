"use client";

interface VoteCardProps {
  value: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function VoteCard({ value, isSelected, onClick, disabled }: VoteCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-16 h-24 rounded-xl border-2 text-lg font-bold
        flex items-center justify-center
        transition-all duration-200
        ${isSelected
          ? "border-indigo-400 bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30"
          : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400 hover:bg-gray-700 hover:-translate-y-1"
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
      `}
    >
      {value}
    </button>
  );
}
