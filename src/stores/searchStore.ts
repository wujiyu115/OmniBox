import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SearchResult, SearchRequest, ApiResponse } from '../types';

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  setSelectedIndex: (index: number) => void;
  selectResult: () => SearchResult | null;
  navigateUp: () => void;
  navigateDown: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isLoading: false,
  selectedIndex: -1,

  setQuery: (query) => set({ query }),

  search: async () => {
    const { query } = get();
    if (!query.trim()) {
      set({ results: [], selectedIndex: -1 });
      return;
    }

    set({ isLoading: true });
    try {
      const request: SearchRequest = { query, limit: 20 };
      const response = await invoke<ApiResponse<SearchResult[]>>('search', { request });
      
      if (response.success && response.data) {
        set({ 
          results: response.data, 
          selectedIndex: response.data.length > 0 ? 0 : -1 
        });
      } else {
        set({ results: [], selectedIndex: -1 });
      }
    } catch (error) {
      console.error('Search error:', error);
      set({ results: [], selectedIndex: -1 });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  selectResult: () => {
    const { results, selectedIndex } = get();
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      return results[selectedIndex];
    }
    return null;
  },

  navigateUp: () => {
    const { selectedIndex, results } = get();
    if (results.length === 0) return;
    const newIndex = selectedIndex <= 0 ? results.length - 1 : selectedIndex - 1;
    set({ selectedIndex: newIndex });
  },

  navigateDown: () => {
    const { selectedIndex, results } = get();
    if (results.length === 0) return;
    const newIndex = selectedIndex >= results.length - 1 ? 0 : selectedIndex + 1;
    set({ selectedIndex: newIndex });
  },

  clearSearch: () => set({ query: '', results: [], selectedIndex: -1 }),
}));