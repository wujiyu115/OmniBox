import React from 'react';

interface TimestampRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export const TimestampRow: React.FC<TimestampRowProps> = ({ label, value, onCopy }) => {
  return (
    <div className="flex items-center px-4 py-3 border-b border-base-200 hover:bg-base-200">
      <span className="w-12 text-base-content/70 text-sm">{label}</span>
      <span className="flex-1 font-mono text-base-content">{value}</span>
      <button
        onClick={onCopy}
        className="btn btn-success btn-sm text-white"
      >
        复制
      </button>
    </div>
  );
};
