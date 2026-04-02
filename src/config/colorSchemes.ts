export interface ColorScheme {
  id: string;
  name: string;
  className: string;
  isDark: boolean;
  previewColor: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'blue', name: '默认蓝', className: 'theme-blue', isDark: false, previewColor: '#3b82f6' },
  { id: 'green', name: '翠绿', className: 'theme-green', isDark: false, previewColor: '#22c55e' },
  { id: 'purple', name: '薰衣紫', className: 'theme-purple', isDark: false, previewColor: '#8b5cf6' },
  { id: 'orange', name: '活力橙', className: 'theme-orange', isDark: false, previewColor: '#f97316' },
  { id: 'rose', name: '玫瑰红', className: 'theme-rose', isDark: false, previewColor: '#ec4899' },
  { id: 'gray', name: '极简灰', className: 'theme-gray', isDark: false, previewColor: '#9ca3af' },
  { id: 'dark', name: '暗夜黑', className: 'theme-dark', isDark: true, previewColor: '#1f2937' },
  { id: 'midnight', name: '午夜蓝', className: 'theme-midnight', isDark: true, previewColor: '#0f172a' },
];

export const DEFAULT_COLOR_SCHEME = 'blue';

export function getColorScheme(id: string): ColorScheme {
  return COLOR_SCHEMES.find((s) => s.id === id) || COLOR_SCHEMES[0];
}
