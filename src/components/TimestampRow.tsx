import React from 'react';

interface TimestampRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export const TimestampRow: React.FC<TimestampRowProps> = ({ label, value, onCopy }) => {
  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
      <span className="w-12 text-gray-500 text-sm">{label}</span>
      <span className="flex-1 font-mono text-gray-800">{value}</span>
      <button
        onClick={onCopy}
        className="px-4 py-1.5 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 transition-colors"
      >
        复制
      </button>
    </div>
  );
};
