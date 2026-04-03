export interface DaisyTheme {
  id: string;           // DaisyUI 主题名（如 'light', 'dark', 'cupcake'）
  name: string;         // 中文显示名
  isDark: boolean;      // 是否深色主题
  previewColor: string; // 预览色（主色调，对应 --color-primary）
  previewBgColor: string; // 预览背景色（对应 --color-base-100）
}

export const DAISY_THEMES: DaisyTheme[] = [
  // 浅色主题（previewColor 取自 --color-primary，previewBgColor 取自 --color-base-100）
  { id: 'light', name: '明亮', isDark: false, previewColor: '#422ad5', previewBgColor: '#ffffff' },
  { id: 'cupcake', name: '纸杯蛋糕', isDark: false, previewColor: '#44ebd3', previewBgColor: '#faf7f5' },
  { id: 'bumblebee', name: '蜜蜂', isDark: false, previewColor: '#fdc700', previewBgColor: '#ffffff' },
  { id: 'emerald', name: '翡翠', isDark: false, previewColor: '#66cc8a', previewBgColor: '#ffffff' },
  { id: 'corporate', name: '商务', isDark: false, previewColor: '#0082ce', previewBgColor: '#ffffff' },
  { id: 'retro', name: '复古', isDark: false, previewColor: '#ff9fa0', previewBgColor: '#ece3ca' },
  { id: 'cyberpunk', name: '赛博朋克', isDark: false, previewColor: '#ff6596', previewBgColor: '#fff248' },
  { id: 'valentine', name: '情人节', isDark: false, previewColor: '#f43098', previewBgColor: '#fcf2f8' },
  { id: 'garden', name: '花园', isDark: false, previewColor: '#fe0075', previewBgColor: '#e9e7e7' },
  { id: 'lofi', name: 'Lo-Fi', isDark: false, previewColor: '#0d0d0d', previewBgColor: '#ffffff' },
  { id: 'pastel', name: '粉彩', isDark: false, previewColor: '#e9d4ff', previewBgColor: '#ffffff' },
  { id: 'fantasy', name: '幻想', isDark: false, previewColor: '#6d0076', previewBgColor: '#ffffff' },
  { id: 'wireframe', name: '线框', isDark: false, previewColor: '#d4d4d4', previewBgColor: '#ffffff' },
  { id: 'cmyk', name: 'CMYK', isDark: false, previewColor: '#45aeee', previewBgColor: '#ffffff' },
  { id: 'autumn', name: '秋日', isDark: false, previewColor: '#8c0327', previewBgColor: '#f1f1f1' },
  { id: 'acid', name: '酸性', isDark: false, previewColor: '#ff00ff', previewBgColor: '#f8f8f8' },
  { id: 'lemonade', name: '柠檬水', isDark: false, previewColor: '#419400', previewBgColor: '#f8fdef' },
  { id: 'winter', name: '冬日', isDark: false, previewColor: '#0069ff', previewBgColor: '#ffffff' },
  { id: 'nord', name: '北欧', isDark: false, previewColor: '#5e81ac', previewBgColor: '#eceff4' },
  { id: 'caramellatte', name: '焦糖拿铁', isDark: false, previewColor: '#000000', previewBgColor: '#fff7ed' },
  { id: 'silk', name: '丝绸', isDark: false, previewColor: '#1c1c29', previewBgColor: '#f7f5f3' },
  // 深色主题
  { id: 'dark', name: '暗夜', isDark: true, previewColor: '#605dff', previewBgColor: '#1d232a' },
  { id: 'synthwave', name: '合成波', isDark: true, previewColor: '#f861b4', previewBgColor: '#09002f' },
  { id: 'halloween', name: '万圣节', isDark: true, previewColor: '#ff8f00', previewBgColor: '#1b1816' },
  { id: 'forest', name: '森林', isDark: true, previewColor: '#1fb854', previewBgColor: '#1b1717' },
  { id: 'aqua', name: '水蓝', isDark: true, previewColor: '#13ecf3', previewBgColor: '#1a368b' },
  { id: 'black', name: '纯黑', isDark: true, previewColor: '#3a3a3a', previewBgColor: '#000000' },
  { id: 'luxury', name: '奢华', isDark: true, previewColor: '#ffffff', previewBgColor: '#09090b' },
  { id: 'dracula', name: '德古拉', isDark: true, previewColor: '#ff79c6', previewBgColor: '#282a36' },
  { id: 'business', name: '商业', isDark: true, previewColor: '#1c4e80', previewBgColor: '#202020' },
  { id: 'night', name: '夜晚', isDark: true, previewColor: '#3abdf7', previewBgColor: '#0f172a' },
  { id: 'coffee', name: '咖啡', isDark: true, previewColor: '#db924c', previewBgColor: '#261b25' },
  { id: 'dim', name: '微暗', isDark: true, previewColor: '#9fe88d', previewBgColor: '#2a303c' },
  { id: 'sunset', name: '日落', isDark: true, previewColor: '#ff865b', previewBgColor: '#121c22' },
  { id: 'abyss', name: '深渊', isDark: true, previewColor: '#bdff00', previewBgColor: '#001e29' },
];

// 兼容旧接口的类型别名
export type ColorScheme = DaisyTheme;
export const COLOR_SCHEMES = DAISY_THEMES;

export const DEFAULT_COLOR_SCHEME = 'light';

export function getColorScheme(id: string): DaisyTheme {
  return DAISY_THEMES.find((s) => s.id === id) || DAISY_THEMES[0];
}

// 按浅色/深色分组
export const LIGHT_THEMES = DAISY_THEMES.filter((t) => !t.isDark);
export const DARK_THEMES = DAISY_THEMES.filter((t) => t.isDark);
