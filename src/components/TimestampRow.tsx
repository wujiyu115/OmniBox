import React from 'react';

interface TimestampRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export const TimestampRow: React.FC<TimestampRowProps> = ({ label, value, onCopy }) => {
  return (
    <div className="flex items-center px-4 py-3 border-b border-theme-border-light hover:bg-theme-card-hover">
      <span className="w-12 text-theme-text-secondary text-sm">{label}</span>
      <span className="flex-1 font-mono text-theme-text">{value}</span>
      <button
        onClick={onCopy}
        className="px-4 py-1.5 bg-theme-success text-white text-sm rounded hover:opacity-90 transition-colors"
      >
        复制
      </button>
    </div>
  );
};
