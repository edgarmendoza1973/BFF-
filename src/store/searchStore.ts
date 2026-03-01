import { create } from 'zustand';

interface SearchResults {
  verses: any[];
  events: any[];
  groups: any[];
  sermons: any[];
  prayers: any[];
}

interface SearchStore {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  recentSearches: string[];
  setQuery: (q: string) => void;
  search: (q: string) => Promise<void>;
  clearResults: () => void;
  addRecentSearch: (q: string) => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: null,
  loading: false,
  recentSearches: [],

  setQuery: (q) => set({ query: q }),

  search: async (q) => {
    if (!q.trim()) return;
    set({ loading: true });
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      set({ results: data });
      get().addRecentSearch(q);
    } finally {
      set({ loading: false });
    }
  },

  clearResults: () => set({ results: null, query: '' }),

  addRecentSearch: (q) => {
    set(state => ({
      recentSearches: [q, ...state.recentSearches.filter(s => s !== q)].slice(0, 10),
    }));
  },
}));
