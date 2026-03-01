'use client';
import { useState, useEffect } from 'react';
import { HandHeart, Plus, Check, X, Globe, Lock, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function PrayerListPage() {
  const { data: session } = useSession();
  const [myPrayers, setMyPrayers] = useState<any[]>([]);
  const [communityPrayers, setCommunityPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', is_private: false });
  const [saving, setSaving] = useState(false);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    loadPrayers();
  }, []);

  async function loadPrayers() {
    try {
      const [myRes, communityRes] = await Promise.all([
        fetch('/api/prayer?type=my'),
        fetch('/api/prayer?type=community'),
      ]);
      const myData = await myRes.json();
      const communityData = await communityRes.json();
      setMyPrayers(myData.prayers || []);
      setCommunityPrayers(communityData.prayers || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('🙏 Prayer request added!');
        setShowForm(false);
        setForm({ title: '', description: '', is_private: false });
        loadPrayers();
      }
    } catch { toast.error('Failed to add prayer'); }
    finally { setSaving(false); }
  }

  async function handlePray(prayerId: number) {
    try {
      await fetch(`/api/prayer/${prayerId}/prayed`, { method: 'POST' });
      toast.success('🙏 Prayer recorded!');
      loadPrayers();
    } catch {}
  }

  async function handleAnswer(prayerId: number) {
    const notes = prompt('How did God answer this prayer?');
    if (notes === null) return;
    try {
      await fetch(`/api/prayer/${prayerId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_notes: notes }),
      });
      toast.success('✨ Praise God! Prayer answered!');
      loadPrayers();
    } catch {}
  }

  async function handleDelete(prayerId: number) {
    if (!confirm('Delete this prayer request?')) return;
    try {
      await fetch(`/api/prayer/${prayerId}`, { method: 'DELETE' });
      toast.success('Prayer deleted');
      loadPrayers();
    } catch {}
  }

  const PrayerCard = ({ prayer, isOwner }: { prayer: any; isOwner: boolean }) => (
    <Card className={prayer.is_answered ? 'border-green-200 bg-green-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{prayer.title}</h3>
              {prayer.is_answered && <Badge variant="success" className="text-xs">✨ Answered</Badge>}
              {prayer.is_private ? (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
              ) : (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Globe className="h-3 w-3" /> Shared</span>
              )}
            </div>
            {prayer.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prayer.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {prayer.user_name && <span>by {prayer.user_name}</span>}
              <span>{formatRelativeTime(prayer.created_at)}</span>
            </div>
          </div>
        </div>

        {prayer.answer_notes && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg text-xs text-green-700">
            <strong>Answered:</strong> {prayer.answer_notes}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {!isOwner && (
            <button
              onClick={() => handlePray(prayer.id)}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
            >
              🙏 Pray ({prayer.prayed_count || 0})
            </button>
          )}
          {isOwner && !prayer.is_answered && (
            <button
              onClick={() => handleAnswer(prayer.id)}
              className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <Check className="h-3 w-3" /> Mark Answered
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => handleDelete(prayer.id)}
              className="ml-auto p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🙏 Prayer List</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pray for one another</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add Prayer
        </button>
      </div>

      {/* Add Prayer Form */}
      {showForm && (
        <Card className="border-indigo-200">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">New Prayer Request</h3>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Prayer request title"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="More details (optional)..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl resize-none h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm({ ...form, is_private: !form.is_private })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  form.is_private ? 'bg-gray-100 text-gray-700' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {form.is_private ? <><Lock className="h-3 w-3" /> Private</> : <><Globe className="h-3 w-3" /> Shared</>}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Request'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="community">
        <TabsList className="w-full">
          <TabsTrigger value="community" className="flex-1">Community ({communityPrayers.length})</TabsTrigger>
          <TabsTrigger value="my" className="flex-1">My Prayers ({myPrayers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="mt-4 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : communityPrayers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <HandHeart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>No community prayer requests yet</p>
            </div>
          ) : (
            communityPrayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} isOwner={prayer.user_id === userId} />
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-4 space-y-3">
          {myPrayers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>You haven&apos;t added any prayers yet</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-600 text-sm font-medium">
                Add your first prayer
              </button>
            </div>
          ) : (
            myPrayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} isOwner={true} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
