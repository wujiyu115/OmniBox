import React from 'react';
import type { FormatEntry } from '../types';

interface FormatTableProps {
  formats: FormatEntry[];
  onLoad: (value: string) => void;
}

export const FormatTable: React.FC<FormatTableProps> = ({ formats, onLoad }) => {
  return (
    <div className="border-t border-base-300">
      <div className="grid grid-cols-3 bg-base-200 text-sm font-medium text-base-content/70">
        <div className="px-4 py-2">格式</div>
        <div className="px-4 py-2">值</div>
        <div className="px-4 py-2 text-right">操作</div>
      </div>
      {formats.map((entry, index) => (
        <div
          key={index}
          className="grid grid-cols-3 border-t border-base-200 hover:bg-base-200 text-sm"
        >
          <div className="px-4 py-3 text-base-content/70">{entry.format}</div>
          <div className="px-4 py-3 font-mono text-base-content">{entry.value}</div>
          <div className="px-4 py-2 text-right">
            <button
              onClick={() => onLoad(entry.value)}
              className="btn btn-outline btn-xs"
            >
              加载
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
