import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const bibleBooks: { number: number; name: string; abbrev: string }[] = [
  { number: 1, name: 'Genesis', abbrev: 'Gen' },
  { number: 2, name: 'Exodus', abbrev: 'Exod' },
  { number: 3, name: 'Leviticus', abbrev: 'Lev' },
  { number: 4, name: 'Numbers', abbrev: 'Num' },
  { number: 5, name: 'Deuteronomy', abbrev: 'Deut' },
  { number: 6, name: 'Joshua', abbrev: 'Josh' },
  { number: 7, name: 'Judges', abbrev: 'Judg' },
  { number: 8, name: 'Ruth', abbrev: 'Ruth' },
  { number: 9, name: '1 Samuel', abbrev: '1Sam' },
  { number: 10, name: '2 Samuel', abbrev: '2Sam' },
  { number: 11, name: '1 Kings', abbrev: '1Kgs' },
  { number: 12, name: '2 Kings', abbrev: '2Kgs' },
  { number: 13, name: '1 Chronicles', abbrev: '1Chr' },
  { number: 14, name: '2 Chronicles', abbrev: '2Chr' },
  { number: 15, name: 'Ezra', abbrev: 'Ezra' },
  { number: 16, name: 'Nehemiah', abbrev: 'Neh' },
  { number: 17, name: 'Esther', abbrev: 'Esth' },
  { number: 18, name: 'Job', abbrev: 'Job' },
  { number: 19, name: 'Psalms', abbrev: 'Ps' },
  { number: 20, name: 'Proverbs', abbrev: 'Prov' },
  { number: 21, name: 'Ecclesiastes', abbrev: 'Eccl' },
  { number: 22, name: 'Song of Solomon', abbrev: 'Song' },
  { number: 23, name: 'Isaiah', abbrev: 'Isa' },
  { number: 24, name: 'Jeremiah', abbrev: 'Jer' },
  { number: 25, name: 'Lamentations', abbrev: 'Lam' },
  { number: 26, name: 'Ezekiel', abbrev: 'Ezek' },
  { number: 27, name: 'Daniel', abbrev: 'Dan' },
  { number: 28, name: 'Hosea', abbrev: 'Hos' },
  { number: 29, name: 'Joel', abbrev: 'Joel' },
  { number: 30, name: 'Amos', abbrev: 'Amos' },
  { number: 31, name: 'Obadiah', abbrev: 'Obad' },
  { number: 32, name: 'Jonah', abbrev: 'Jonah' },
  { number: 33, name: 'Micah', abbrev: 'Mic' },
  { number: 34, name: 'Nahum', abbrev: 'Nah' },
  { number: 35, name: 'Habakkuk', abbrev: 'Hab' },
  { number: 36, name: 'Zephaniah', abbrev: 'Zeph' },
  { number: 37, name: 'Haggai', abbrev: 'Hag' },
  { number: 38, name: 'Zechariah', abbrev: 'Zech' },
  { number: 39, name: 'Malachi', abbrev: 'Mal' },
  { number: 40, name: 'Matthew', abbrev: 'Matt' },
  { number: 41, name: 'Mark', abbrev: 'Mark' },
  { number: 42, name: 'Luke', abbrev: 'Luke' },
  { number: 43, name: 'John', abbrev: 'John' },
  { number: 44, name: 'Acts', abbrev: 'Acts' },
  { number: 45, name: 'Romans', abbrev: 'Rom' },
  { number: 46, name: '1 Corinthians', abbrev: '1Cor' },
  { number: 47, name: '2 Corinthians', abbrev: '2Cor' },
  { number: 48, name: 'Galatians', abbrev: 'Gal' },
  { number: 49, name: 'Ephesians', abbrev: 'Eph' },
  { number: 50, name: 'Philippians', abbrev: 'Phil' },
  { number: 51, name: 'Colossians', abbrev: 'Col' },
  { number: 52, name: '1 Thessalonians', abbrev: '1Thess' },
  { number: 53, name: '2 Thessalonians', abbrev: '2Thess' },
  { number: 54, name: '1 Timothy', abbrev: '1Tim' },
  { number: 55, name: '2 Timothy', abbrev: '2Tim' },
  { number: 56, name: 'Titus', abbrev: 'Titus' },
  { number: 57, name: 'Philemon', abbrev: 'Phlm' },
  { number: 58, name: 'Hebrews', abbrev: 'Heb' },
  { number: 59, name: 'James', abbrev: 'Jas' },
  { number: 60, name: '1 Peter', abbrev: '1Pet' },
  { number: 61, name: '2 Peter', abbrev: '2Pet' },
  { number: 62, name: '1 John', abbrev: '1John' },
  { number: 63, name: '2 John', abbrev: '2John' },
  { number: 64, name: '3 John', abbrev: '3John' },
  { number: 65, name: 'Jude', abbrev: 'Jude' },
  { number: 66, name: 'Revelation', abbrev: 'Rev' },
];

export function getBookName(number: number): string {
  return bibleBooks.find((b) => b.number === number)?.name || `Book ${number}`;
}

export function getBookNumber(name: string): number {
  return bibleBooks.find((b) => b.name.toLowerCase() === name.toLowerCase())?.number || 1;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getAvatarUrl(name: string, size = 40): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=4f46e5&color=fff&bold=true`;
}
