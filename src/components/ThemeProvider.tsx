import React, { useEffect, createContext, useContext } from 'react';
import { useThemeStore } from '../stores';
import { listen } from '@tauri-apps/api/event';

interface ThemeContextValue {
  colorScheme: string;
  setColorScheme: (schemeId: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'blue',
  setColorScheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { colorScheme, setColorScheme, isDark, initColorScheme } = useThemeStore();

  useEffect(() => {
    // 初始化配色方案
    initColorScheme();

    // 监听后端配置变更事件（热重载）
    const unlisten = listen<{ theme: string }>('config-changed', (event) => {
      const newScheme = event.payload.theme;
      if (newScheme && newScheme !== useThemeStore.getState().colorScheme) {
        setColorScheme(newScheme);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
