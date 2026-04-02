import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, getColorScheme } from '../config/colorSchemes';

interface ThemeState {
  colorScheme: string;
  isDark: boolean;
  setColorScheme: (schemeId: string) => void;
  initColorScheme: () => Promise<void>;
}

const applyColorScheme = (schemeId: string) => {
  const scheme = getColorScheme(schemeId);
  const root = document.documentElement;

  // 移除所有配色方案 class
  COLOR_SCHEMES.forEach((s) => {
    root.classList.remove(s.className);
  });
  root.classList.remove('dark');

  // 添加新的配色方案 class
  root.classList.add(scheme.className);

  // 深色方案同时添加 dark class
  if (scheme.isDark) {
    root.classList.add('dark');
  }
};

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: DEFAULT_COLOR_SCHEME,
  isDark: false,

  setColorScheme: (schemeId: string) => {
    const scheme = getColorScheme(schemeId);
    applyColorScheme(schemeId);
    set({ colorScheme: schemeId, isDark: scheme.isDark });
    // 持久化到后端配置
    invoke('update_config', { config: { theme: schemeId, language: 'zh-CN' } }).catch(console.error);
  },

  initColorScheme: async () => {
    try {
      const result = await invoke<{ success: boolean; data: { theme: string } }>('get_config');
      if (result.success && result.data) {
        // 兼容旧配置：dark → theme-dark, light → theme-blue
        let schemeId = result.data.theme;
        if (schemeId === 'dark') {
          schemeId = 'dark';
        } else if (schemeId === 'light' || !COLOR_SCHEMES.find((s) => s.id === schemeId)) {
          schemeId = DEFAULT_COLOR_SCHEME;
        }
        const scheme = getColorScheme(schemeId);
        applyColorScheme(schemeId);
        set({ colorScheme: schemeId, isDark: scheme.isDark });
      }
    } catch (e) {
      console.error('Failed to load color scheme config:', e);
      applyColorScheme(DEFAULT_COLOR_SCHEME);
    }
  },
}));
