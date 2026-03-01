"use client";
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Calendar, Users, Play, Heart, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';

interface SearchResults {
  verses: any[];
  events: any[];
  groups: any[];
  sermons: any[];
  prayers: any[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 400);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results
    ? (results.verses?.length || 0) + (results.events?.length || 0) +
      (results.groups?.length || 0) + (results.sermons?.length || 0) +
      (results.prayers?.length || 0)
    : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-sm text-gray-500">Search across Bible, events, groups, sermons & more</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search everything..."
          className="pl-10 h-12 text-base"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {!results && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500">What are you looking for?</p>
          <p className="text-sm mt-1">Search Bible verses, events, groups, sermons...</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Genesis 1:1', 'prayer', 'Sunday service', 'worship'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {results && (
        <>
          {totalResults === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No results for "{query}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">{totalResults} results for "{query}"</p>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full overflow-x-auto">
                  <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                  {(results.verses?.length || 0) > 0 && <TabsTrigger value="verses">Verses ({results.verses.length})</TabsTrigger>}
                  {(results.events?.length || 0) > 0 && <TabsTrigger value="events">Events ({results.events.length})</TabsTrigger>}
                  {(results.groups?.length || 0) > 0 && <TabsTrigger value="groups">Groups ({results.groups.length})</TabsTrigger>}
                  {(results.sermons?.length || 0) > 0 && <TabsTrigger value="sermons">Sermons ({results.sermons.length})</TabsTrigger>}
                </TabsList>

                <TabsContent value="all" className="mt-4 space-y-3">
                  {/* Verses */}
                  {results.verses?.slice(0, 3).map((v: any) => (
                    <Card key={`v-${v.id}`}>
                      <CardContent className="p-3 flex gap-3">
                        <BookOpen className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-indigo-600">
                            {v.book_name} {v.chapter}:{v.verse} ({v.version_id})
                          </p>
                          <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{v.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Events */}
                  {results.events?.slice(0, 2).map((e: any) => (
                    <Card key={`e-${e.id}`}>
                      <CardContent className="p-3 flex gap-3">
                        <Calendar className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-gray-500">{e.location}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">Event</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Groups */}
                  {results.groups?.slice(0, 2).map((g: any) => (
                    <Card key={`g-${g.id}`}>
                      <CardContent className="p-3 flex gap-3">
                        <Users className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{g.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{g.category}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">Group</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Sermons */}
                  {results.sermons?.slice(0, 2).map((s: any) => (
                    <Card key={`s-${s.id}`}>
                      <CardContent className="p-3 flex gap-3">
                        <Play className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-gray-500">{s.speaker} · {s.bible_passage}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">Sermon</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="verses" className="mt-4 space-y-3">
                  {results.verses?.map((v: any) => (
                    <Card key={v.id}>
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-indigo-700 mb-1">
                          {v.book_name} {v.chapter}:{v.verse} ({v.version_id})
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{v.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="events" className="mt-4 space-y-3">
                  {results.events?.map((e: any) => (
                    <Card key={e.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium">{e.title}</p>
                          <p className="text-sm text-gray-500">{e.location} · {e.event_date}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="groups" className="mt-4 space-y-3">
                  {results.groups?.map((g: any) => (
                    <Card key={g.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="font-medium">{g.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{g.category} · {g.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="sermons" className="mt-4 space-y-3">
                  {results.sermons?.map((s: any) => (
                    <Card key={s.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Play className="h-8 w-8 text-amber-500" />
                        <div>
                          <p className="font-medium">{s.title}</p>
                          <p className="text-sm text-gray-500">{s.speaker} · {s.bible_passage}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
