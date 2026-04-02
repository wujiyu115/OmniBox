import React from 'react';
import type { FormatEntry } from '../types';

interface FormatTableProps {
  formats: FormatEntry[];
  onLoad: (value: string) => void;
}

export const FormatTable: React.FC<FormatTableProps> = ({ formats, onLoad }) => {
  return (
    <div className="border-t border-theme-border">
      <div className="grid grid-cols-3 bg-theme-bg text-sm font-medium text-theme-text-secondary">
        <div className="px-4 py-2">格式</div>
        <div className="px-4 py-2">值</div>
        <div className="px-4 py-2 text-right">操作</div>
      </div>
      {formats.map((entry, index) => (
        <div
          key={index}
          className="grid grid-cols-3 border-t border-theme-border-light hover:bg-theme-card-hover text-sm"
        >
          <div className="px-4 py-3 text-theme-text-secondary">{entry.format}</div>
          <div className="px-4 py-3 font-mono text-theme-text">{entry.value}</div>
          <div className="px-4 py-2 text-right">
            <button
              onClick={() => onLoad(entry.value)}
              className="px-3 py-1 border border-theme-border rounded text-theme-text-secondary hover:bg-theme-bg transition-colors"
            >
              加载
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
