'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, Eye, EyeOff, Lock, Users, Globe, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

const privacyOptions = [
  { value: 'private', label: 'Private', icon: Lock, color: 'text-gray-500' },
  { value: 'leader', label: 'Leader Only', icon: User, color: 'text-blue-500' },
  { value: 'group', label: 'My Group', icon: Users, color: 'text-purple-500' },
  { value: 'community', label: 'Community', icon: Globe, color: 'text-green-500' },
];

export default function SOAPJournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [form, setForm] = useState({
    scripture: '',
    verse_reference: '',
    observation: '',
    application: '',
    prayer: '',
    privacy_level: 'private',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const res = await fetch('/api/soap');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.scripture.trim()) {
      toast.error('Scripture is required');
      return;
    }
    setSaving(true);
    try {
      const method = editEntry ? 'PUT' : 'POST';
      const url = editEntry ? `/api/soap/${editEntry.id}` : '/api/soap';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success(editEntry ? 'Entry updated!' : '✝️ Journal entry saved!');
      setShowForm(false);
      setEditEntry(null);
      setForm({ scripture: '', verse_reference: '', observation: '', application: '', prayer: '', privacy_level: 'private' });
      loadEntries();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await fetch(`/api/soap/${id}`, { method: 'DELETE' });
      toast.success('Entry deleted');
      setEntries(entries.filter((e) => e.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  }

  function startEdit(entry: any) {
    setForm({
      scripture: entry.scripture,
      verse_reference: entry.verse_reference || '',
      observation: entry.observation || '',
      application: entry.application || '',
      prayer: entry.prayer || '',
      privacy_level: entry.privacy_level || 'private',
    });
    setEditEntry(entry);
    setShowForm(true);
  }

  const privacyBadge = (level: string) => {
    const option = privacyOptions.find((o) => o.value === level);
    return option ? (
      <span className={`flex items-center gap-1 text-xs ${option.color}`}>
        <option.icon className="h-3 w-3" />
        {option.label}
      </span>
    ) : null;
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📖 SOAP Journal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scripture, Observation, Application, Prayer</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditEntry(null); setForm({ scripture: '', verse_reference: '', observation: '', application: '', prayer: '', privacy_level: 'private' }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> New Entry
        </button>
      </div>

      {/* SOAP Form */}
      {showForm && (
        <Card className="border-indigo-200 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editEntry ? 'Edit Entry' : 'New SOAP Entry'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">📖 Scripture</label>
                <textarea
                  value={form.scripture}
                  onChange={(e) => setForm({ ...form, scripture: e.target.value })}
                  placeholder="Write or paste the scripture passage..."
                  className="w-full p-3 border border-gray-300 rounded-xl resize-none h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">📍 Reference</label>
                <input
                  type="text"
                  value={form.verse_reference}
                  onChange={(e) => setForm({ ...form, verse_reference: e.target.value })}
                  placeholder="e.g., John 3:16"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1 block">🔍 Observation — What does it say?</label>
              <textarea
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                placeholder="What do you observe in this passage?"
                className="w-full p-3 border border-gray-300 rounded-xl resize-none h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1 block">🎯 Application — What does it mean for me?</label>
              <textarea
                value={form.application}
                onChange={(e) => setForm({ ...form, application: e.target.value })}
                placeholder="How does this apply to your life today?"
                className="w-full p-3 border border-gray-300 rounded-xl resize-none h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1 block">🙏 Prayer — Talk to God about it</label>
              <textarea
                value={form.prayer}
                onChange={(e) => setForm({ ...form, prayer: e.target.value })}
                placeholder="Write a prayer based on this passage..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Privacy</label>
              <div className="grid grid-cols-4 gap-2">
                {privacyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, privacy_level: opt.value })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-colors ${
                      form.privacy_level === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <opt.icon className={`h-4 w-4 ${opt.color}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditEntry(null); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
              >
                {saving ? 'Saving...' : editEntry ? 'Update' : 'Save Entry'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-medium text-gray-600">No journal entries yet</p>
          <p className="text-sm mt-1">Start your first SOAP journal entry to grow in the Word!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    {entry.verse_reference && (
                      <div className="text-sm font-bold text-indigo-600 mb-1">📍 {entry.verse_reference}</div>
                    )}
                    <div className="text-sm text-gray-500">{formatRelativeTime(entry.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {privacyBadge(entry.privacy_level)}
                    <button onClick={() => startEdit(entry)} className="p-1.5 text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {entry.scripture && (
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Scripture</span>
                      <p className="text-sm text-gray-700 italic mt-0.5 line-clamp-2">{entry.scripture}</p>
                    </div>
                  )}
                  {entry.observation && (
                    <div>
                      <span className="text-xs font-semibold text-blue-400 uppercase">Observation</span>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{entry.observation}</p>
                    </div>
                  )}
                  {entry.application && (
                    <div>
                      <span className="text-xs font-semibold text-green-400 uppercase">Application</span>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{entry.application}</p>
                    </div>
                  )}
                  {entry.prayer && (
                    <div>
                      <span className="text-xs font-semibold text-purple-400 uppercase">Prayer</span>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{entry.prayer}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
