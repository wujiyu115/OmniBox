import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Plugin, ApiResponse } from '../types';

interface PluginState {
  installedPlugins: Plugin[];
  isLoading: boolean;
  
  loadInstalledPlugins: () => Promise<void>;
  getPluginById: (id: string) => Plugin | undefined;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  installedPlugins: [],
  isLoading: false,

  loadInstalledPlugins: async () => {
    set({ isLoading: true });
    try {
      const response = await invoke<ApiResponse<Plugin[]>>('get_installed_plugins');
      if (response.success && response.data) {
        set({ installedPlugins: response.data });
      }
    } catch (error) {
      console.error('Load plugins error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getPluginById: (id) => {
    return get().installedPlugins.find(p => p.id === id);
  },
}));