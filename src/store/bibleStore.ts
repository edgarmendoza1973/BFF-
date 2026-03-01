import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Verse {
  verse: number;
  text: string;
  book_number?: number;
  chapter?: number;
  version_id?: string;
}

interface Note {
  id: number;
  verse: number;
  note_text: string;
  chapter: number;
  book_number: number;
  version_id: string;
  created_at: string;
}

interface Bookmark {
  id: number;
  verse: number;
  chapter: number;
  book_number: number;
  version_id: string;
  tags: string[];
  created_at: string;
}

interface BibleStore {
  currentVersion: string;
  currentBook: number;
  currentChapter: number;
  currentBookName: string;
  verses: Verse[];
  highlightedVerses: number[];
  selectedVerse: number | null;
  notes: Note[];
  bookmarks: Bookmark[];
  isLoading: boolean;
  totalChapters: number;
  setVersion: (version: string) => void;
  setBook: (book: number, name: string) => void;
  setChapter: (chapter: number) => void;
  setVerses: (verses: Verse[]) => void;
  toggleHighlight: (verse: number) => void;
  selectVerse: (verse: number | null) => void;
  setNotes: (notes: Note[]) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setLoading: (loading: boolean) => void;
  setTotalChapters: (total: number) => void;
  loadChapter: (version: string, book: number, chapter: number) => Promise<void>;
}

export const useBibleStore = create<BibleStore>()(
  persist(
    (set, get) => ({
      currentVersion: 'ESV',
      currentBook: 1,
      currentChapter: 1,
      currentBookName: 'Genesis',
      verses: [],
      highlightedVerses: [],
      selectedVerse: null,
      notes: [],
      bookmarks: [],
      isLoading: false,
      totalChapters: 50,
      setVersion: (version) => set({ currentVersion: version }),
      setBook: (book, name) => set({ currentBook: book, currentBookName: name }),
      setChapter: (chapter) => set({ currentChapter: chapter }),
      setVerses: (verses) => set({ verses }),
      toggleHighlight: (verse) => {
        const { highlightedVerses } = get();
        if (highlightedVerses.includes(verse)) {
          set({ highlightedVerses: highlightedVerses.filter((v) => v !== verse) });
        } else {
          set({ highlightedVerses: [...highlightedVerses, verse] });
        }
      },
      selectVerse: (verse) => set({ selectedVerse: verse }),
      setNotes: (notes) => set({ notes }),
      setBookmarks: (bookmarks) => set({ bookmarks }),
      setLoading: (isLoading) => set({ isLoading }),
      setTotalChapters: (totalChapters) => set({ totalChapters }),
      loadChapter: async (version, book, chapter) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/bible/verses?version=${version}&book=${book}&chapter=${chapter}`);
          const data = await res.json();
          if (data.verses) {
            set({ verses: data.verses, currentVersion: version, currentBook: book, currentChapter: chapter });
          }
        } catch (error) {
          console.error('Failed to load chapter:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'bff-bible',
      partialize: (state) => ({
        currentVersion: state.currentVersion,
        currentBook: state.currentBook,
        currentChapter: state.currentChapter,
        currentBookName: state.currentBookName,
        highlightedVerses: state.highlightedVerses,
      }),
    }
  )
);
