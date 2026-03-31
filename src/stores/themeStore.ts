import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  initTheme: () => Promise<void>;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    set({ theme });
    // 持久化到后端配置
    invoke('update_config', { config: { theme, language: 'zh-CN' } }).catch(console.error);
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  initTheme: async () => {
    try {
      const result = await invoke<{ success: boolean; data: { theme: string } }>('get_config');
      if (result.success && result.data) {
        const theme = (result.data.theme === 'dark' ? 'dark' : 'light') as Theme;
        applyTheme(theme);
        set({ theme });
      }
    } catch (e) {
      console.error('Failed to load theme config:', e);
      // 使用默认 light 主题
      applyTheme('light');
    }
  },
}));
