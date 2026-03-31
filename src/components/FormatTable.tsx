import React from 'react';
import type { FormatEntry } from '../types';

interface FormatTableProps {
  formats: FormatEntry[];
  onLoad: (value: string) => void;
}

export const FormatTable: React.FC<FormatTableProps> = ({ formats, onLoad }) => {
  return (
    <div className="border-t border-gray-200">
      <div className="grid grid-cols-3 bg-gray-50 text-sm font-medium text-gray-600">
        <div className="px-4 py-2">格式</div>
        <div className="px-4 py-2">值</div>
        <div className="px-4 py-2 text-right">操作</div>
      </div>
      {formats.map((entry, index) => (
        <div
          key={index}
          className="grid grid-cols-3 border-t border-gray-100 hover:bg-gray-50 text-sm"
        >
          <div className="px-4 py-3 text-gray-600">{entry.format}</div>
          <div className="px-4 py-3 font-mono text-gray-800">{entry.value}</div>
          <div className="px-4 py-2 text-right">
            <button
              onClick={() => onLoad(entry.value)}
              className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              加载
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
