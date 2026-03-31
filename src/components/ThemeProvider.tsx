import React, { useEffect, createContext, useContext } from 'react';
import { useThemeStore } from '../stores';
import { listen } from '@tauri-apps/api/event';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, toggleTheme, initTheme, setTheme } = useThemeStore();

  useEffect(() => {
    // 初始化主题
    initTheme();

    // 监听后端配置变更事件（热重载）
    const unlisten = listen<{ theme: string }>('config-changed', (event) => {
      const newTheme = event.payload.theme === 'dark' ? 'dark' : 'light';
      if (newTheme !== useThemeStore.getState().theme) {
        setTheme(newTheme);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
