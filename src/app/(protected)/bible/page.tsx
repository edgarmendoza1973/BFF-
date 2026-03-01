'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, StickyNote, Search, Settings, X, Check } from 'lucide-react';
import { useBibleStore } from '@/store/bibleStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const VERSIONS = [
  { id: 'ESV', name: 'English Standard Version', lang: 'en' },
  { id: 'NLT', name: 'New Living Translation', lang: 'en' },
  { id: 'ASND', name: 'Ang Salita ng Diyos', lang: 'fil' },
  { id: 'PINOY', name: 'Ang Bagong Magandang Balita', lang: 'fil' },
];

interface Verse { verse: number; text: string; }

export default function BiblePage() {
  const {
    currentVersion, currentBook, currentChapter, currentBookName,
    verses, highlightedVerses, selectedVerse, notes, bookmarks,
    setVersion, setBook, setChapter, setVerses, toggleHighlight, selectVerse,
    setNotes, setBookmarks, setLoading, setTotalChapters, totalChapters, isLoading,
  } = useBibleStore();

  const [books, setBooks] = useState<any[]>([]);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadBibleData();
  }, [currentVersion, currentBook, currentChapter]);

  useEffect(() => {
    loadUserData();
  }, [currentVersion, currentBook, currentChapter]);

  async function loadBibleData() {
    setLoading(true);
    try {
      const [versesRes, booksRes] = await Promise.all([
        fetch(`/api/bible/verses?version=${currentVersion}&book=${currentBook}&chapter=${currentChapter}`),
        fetch(`/api/bible/books?version=${currentVersion}`),
      ]);
      const versesData = await versesRes.json();
      const booksData = await booksRes.json();

      if (versesData.verses) {
        setVerses(versesData.verses);
        setTotalChapters(versesData.total_chapters || 1);
        setBook(currentBook, versesData.book_name || currentBookName);
      }
      if (booksData.books) setBooks(booksData.books);

      // Save preferences
      await fetch('/api/bible/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_version: currentVersion, last_book: currentBook, last_chapter: currentChapter }),
      });
    } catch (error) {
      console.error('Failed to load Bible:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserData() {
    try {
      const [notesRes, bookmarksRes] = await Promise.all([
        fetch(`/api/bible/notes?version=${currentVersion}&book=${currentBook}&chapter=${currentChapter}`),
        fetch(`/api/bible/bookmarks`),
      ]);
      const notesData = await notesRes.json();
      const bookmarksData = await bookmarksRes.json();
      if (notesData.notes) setNotes(notesData.notes);
      if (bookmarksData.bookmarks) setBookmarks(bookmarksData.bookmarks);
    } catch {}
  }

  async function handleBookmark(verse: number) {
    try {
      const res = await fetch('/api/bible/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: currentVersion, book_number: currentBook, chapter: currentChapter, verse }),
      });
      const data = await res.json();
      toast.success(data.action === 'added' ? 'Verse bookmarked! 🔖' : 'Bookmark removed');
      loadUserData();
    } catch {
      toast.error('Failed to bookmark verse');
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim() || !selectedVerse) return;
    try {
      await fetch('/api/bible/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_id: currentVersion,
          book_number: currentBook,
          chapter: currentChapter,
          verse: selectedVerse,
          note_text: noteText,
        }),
      });
      toast.success('Note saved! 📝');
      setShowNoteModal(false);
      setNoteText('');
      selectVerse(null);
      loadUserData();
    } catch {
      toast.error('Failed to save note');
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/bible/search?q=${encodeURIComponent(searchQuery)}&version=${currentVersion}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {}
  }

  function navigateChapter(dir: number) {
    const newChapter = currentChapter + dir;
    if (newChapter >= 1 && newChapter <= totalChapters) {
      setChapter(newChapter);
    } else if (dir > 0 && currentBook < 66) {
      const nextBook = books.find((b) => b.book_number === currentBook + 1);
      if (nextBook) { setBook(currentBook + 1, nextBook.name); setChapter(1); }
    } else if (dir < 0 && currentBook > 1 && currentChapter === 1) {
      const prevBook = books.find((b) => b.book_number === currentBook - 1);
      if (prevBook) { setBook(currentBook - 1, prevBook.name); setChapter(prevBook.chapters); }
    }
  }

  const isBookmarked = (verse: number) => bookmarks.some((b) => b.book_number === currentBook && b.chapter === currentChapter && b.verse === verse);
  const hasNote = (verse: number) => notes.some((n) => n.book_number === currentBook && n.chapter === currentChapter && n.verse === verse);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowBookSelector(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" />
            <span className="max-w-32 truncate">{currentBookName} {currentChapter}</span>
          </button>

          <button
            onClick={() => setShowVersionSelector(true)}
            className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg font-medium"
          >
            {currentVersion}
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-gray-500 hover:text-gray-700">
              <Search className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-1.5 bg-gray-100 rounded text-xs font-bold">A-</button>
              <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="p-1.5 bg-gray-100 rounded text-sm font-bold">A+</button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search Bible..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button onClick={handleSearch} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Search
            </button>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
            {searchResults.map((result: any, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50"
                onClick={() => {
                  setBook(result.book_number, result.book_name);
                  setChapter(result.chapter);
                  setSearchResults([]);
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <div className="text-xs font-medium text-indigo-600 mb-1">
                  {result.book_name} {result.chapter}:{result.verse}
                </div>
                <div className="text-sm text-gray-700 line-clamp-2">{result.text}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bible Text */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3" />
            <p>This passage is not available in this version yet.</p>
            <p className="text-sm mt-2">Try Genesis 1, Psalm 23, or John 3:16</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-1">
            <h2 className="text-center text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">
              {currentBookName} Chapter {currentChapter}
            </h2>
            {verses.map((v: Verse) => {
              const isHighlighted = highlightedVerses.includes(v.verse);
              const isSelected = selectedVerse === v.verse;
              const bookmarked = isBookmarked(v.verse);
              const noteExists = hasNote(v.verse);

              return (
                <div
                  key={v.verse}
                  onClick={() => selectVerse(isSelected ? null : v.verse)}
                  className={cn(
                    'group relative p-2 rounded-lg cursor-pointer transition-colors leading-relaxed',
                    isHighlighted && 'bg-yellow-50 border-l-4 border-yellow-400',
                    isSelected && 'bg-indigo-50 border-l-4 border-indigo-400',
                    !isHighlighted && !isSelected && 'hover:bg-gray-50'
                  )}
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                >
                  <sup className="text-indigo-500 font-bold text-xs mr-1.5 select-none">{v.verse}</sup>
                  {v.text}
                  {(bookmarked || noteExists) && (
                    <span className="ml-2 inline-flex gap-1">
                      {bookmarked && <Bookmark className="h-3 w-3 text-indigo-400 inline" />}
                      {noteExists && <StickyNote className="h-3 w-3 text-yellow-400 inline" />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verse Actions Popup */}
      {selectedVerse && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl p-3 flex items-center gap-2 z-50">
          <span className="text-sm text-gray-300 mr-2">Verse {selectedVerse}</span>
          <button
            onClick={() => toggleHighlight(selectedVerse)}
            className="flex items-center gap-1.5 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            🖊️ Highlight
          </button>
          <button
            onClick={() => handleBookmark(selectedVerse)}
            className="flex items-center gap-1.5 bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            <Bookmark className="h-3.5 w-3.5" /> Save
          </button>
          <button
            onClick={() => {
              const existingNote = notes.find((n) => n.verse === selectedVerse);
              setNoteText(existingNote?.note_text || '');
              setShowNoteModal(true);
            }}
            className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            📝 Note
          </button>
          <button onClick={() => selectVerse(null)} className="p-2 text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigateChapter(-1)}
            disabled={currentBook === 1 && currentChapter === 1}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalChapters, 5) }, (_, i) => {
              const chapNum = Math.max(1, currentChapter - 2) + i;
              if (chapNum > totalChapters) return null;
              return (
                <button
                  key={chapNum}
                  onClick={() => setChapter(chapNum)}
                  className={cn(
                    'w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    chapNum === currentChapter ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {chapNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => navigateChapter(1)}
            disabled={currentBook === 66 && currentChapter === totalChapters}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Book Selector Modal */}
      {showBookSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Select Book & Chapter</h3>
              <button onClick={() => setShowBookSelector(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Old Testament</h4>
                <div className="grid grid-cols-3 gap-2">
                  {books.filter((b) => b.testament === 'old').map((book) => (
                    <button
                      key={book.book_number}
                      onClick={() => { setBook(book.book_number, book.name); setChapter(1); setShowBookSelector(false); }}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                        currentBook === book.book_number ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-indigo-50'
                      )}
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Testament</h4>
                <div className="grid grid-cols-3 gap-2">
                  {books.filter((b) => b.testament === 'new').map((book) => (
                    <button
                      key={book.book_number}
                      onClick={() => { setBook(book.book_number, book.name); setChapter(1); setShowBookSelector(false); }}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                        currentBook === book.book_number ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-indigo-50'
                      )}
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Selector Modal */}
      {showVersionSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Select Version</h3>
              <button onClick={() => setShowVersionSelector(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-2">
              {VERSIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVersion(v.id); setShowVersionSelector(false); }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left',
                    currentVersion === v.id ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  )}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{v.id}</div>
                    <div className="text-xs text-gray-500">{v.name}</div>
                  </div>
                  {currentVersion === v.id && <Check className="h-5 w-5 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedVerse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Note for {currentBookName} {currentChapter}:{selectedVerse}</h3>
              <button onClick={() => setShowNoteModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 italic mb-3 bg-gray-50 p-3 rounded-lg">
                {verses.find((v) => v.verse === selectedVerse)?.text}
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your thoughts, reflections, or questions about this verse..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none h-32 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
                <button onClick={handleSaveNote} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
