import { create } from 'zustand';

interface JournalEntry {
  id: number;
  scripture: string;
  observation: string;
  application: string;
  prayer: string;
  privacy_level: string;
  verse_reference: string;
  created_at: string;
  updated_at?: string;
}

interface JournalStore {
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  isLoading: boolean;
  setEntries: (entries: JournalEntry[]) => void;
  setCurrentEntry: (entry: JournalEntry | null) => void;
  setLoading: (loading: boolean) => void;
  loadEntries: () => Promise<void>;
  saveEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry | null>;
  deleteEntry: (id: number) => Promise<void>;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  setEntries: (entries) => set({ entries }),
  setCurrentEntry: (entry) => set({ currentEntry: entry }),
  setLoading: (isLoading) => set({ isLoading }),
  loadEntries: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/soap');
      const data = await res.json();
      if (data.entries) set({ entries: data.entries });
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  saveEntry: async (entry) => {
    try {
      const method = entry.id ? 'PUT' : 'POST';
      const url = entry.id ? `/api/soap/${entry.id}` : '/api/soap';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (data.entry) {
        await get().loadEntries();
        return data.entry;
      }
      return null;
    } catch (error) {
      console.error('Failed to save entry:', error);
      return null;
    }
  },
  deleteEntry: async (id) => {
    try {
      await fetch(`/api/soap/${id}`, { method: 'DELETE' });
      set({ entries: get().entries.filter((e) => e.id !== id) });
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  },
}));
