"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Star, Award, Edit2, Save, X, Bell, Camera } from 'lucide-react';
import { BadgeDisplay } from '@/components/features/BadgeDisplay';
import { ProgressChart } from '@/components/features/ProgressChart';
import { ImageUpload } from '@/components/features/ImageUpload';
import toast from 'react-hot-toast';

const LEVEL_CONFIG: Record<string, { label: string; color: string; minPoints: number; maxPoints: number }> = {
  new_member:   { label: 'New Member',   color: 'bg-gray-400',   minPoints: 0,    maxPoints: 100 },
  growing:      { label: 'Growing',      color: 'bg-green-400',  minPoints: 100,  maxPoints: 300 },
  established:  { label: 'Established',  color: 'bg-blue-500',   minPoints: 300,  maxPoints: 700 },
  leader_track: { label: 'Leader Track', color: 'bg-purple-500', minPoints: 700,  maxPoints: 1500 },
  shepherd:     { label: 'Shepherd',     color: 'bg-amber-500',  minPoints: 1500, maxPoints: 3000 },
};

const BIBLE_VERSIONS = ['KJV', 'NIV', 'ESV', 'NKJV', 'NLT', 'CSB', 'NASB', 'MSG'];
const LANGUAGES     = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'tl', label: '🇵🇭 Filipino' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
];

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile]         = useState<any>(null);
  const [badges, setBadges]           = useState<any[]>([]);
  const [progress, setProgress]       = useState<any[]>([]);
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({ displayName: '', bio: '', phone: '' });
  const [saving, setSaving]           = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs]             = useState({ language: 'en', default_bible_version: 'KJV' });
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [profRes, progRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/progress'),
      ]);
      const profData = await profRes.json();
      const progData = await progRes.json();

      setProfile(profData.profile);
      setBadges(profData.badges || []);
      setProgress(progData.history || []);
      setAvatarUrl(profData.profile?.avatar_url || null);
      setForm({
        displayName: profData.profile?.display_name || '',
        bio:         profData.profile?.bio || '',
        phone:       profData.profile?.phone || '',
      });
      setPrefs({
        language:             profData.profile?.language || 'en',
        default_bible_version: profData.profile?.default_bible_version || 'KJV',
      });
    } catch {
      toast.error('Failed to load profile');
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Profile updated!');
        setEditing(false);
        fetchAll();
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: prefs.language, defaultBibleVersion: prefs.default_bible_version }),
      });
      if (res.ok) {
        localStorage.setItem('bff_lang', prefs.language);
        window.dispatchEvent(new CustomEvent('bff_lang_change', { detail: prefs.language }));
        toast.success('Preferences saved!');
        fetchAll();
      }
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  /** Called by ImageUpload once the file is saved server-side */
  const handleAvatarUploaded = async (url: string) => {
    setAvatarUrl(url);
    // Also persist in DB via profile PATCH so avatar_url is returned on next fetch
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    });
    setShowAvatarModal(false);
    toast.success('Profile photo updated!');
    fetchAll();
  };

  const level         = profile?.member_level ? LEVEL_CONFIG[profile.member_level] : LEVEL_CONFIG.new_member;
  const faithPoints   = profile?.faith_points || 0;
  const levelProgress = level
    ? Math.min(((faithPoints - level.minPoints) / (level.maxPoints - level.minPoints)) * 100, 100)
    : 0;
  const user = session?.user as any;

  // Resolve avatar: prefer freshly uploaded, then profile DB value, then session image
  const resolvedAvatar = avatarUrl || profile?.avatar_url || user?.image || undefined;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar + upload trigger */}
            <div className="relative group shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={resolvedAvatar} />
                <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                  {(profile?.display_name || user?.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Change photo"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      value={form.displayName}
                      onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="h-8 text-sm mt-0.5"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bio</Label>
                    <Textarea
                      value={form.bio}
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      rows={2}
                      className="text-sm mt-0.5"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600">
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-3.5 w-3.5 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold truncate">{profile?.display_name || user?.name || 'Anonymous'}</h2>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => setEditing(true)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {profile?.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${level?.color} text-white text-xs`}>
                      {level?.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1 text-amber-500" />
                      {faithPoints} faith pts
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {user?.role || 'member'}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    <Camera className="h-3 w-3 mr-1" />Change Photo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!editing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Level Progress</span>
                <span>{faithPoints} / {level?.maxPoints} pts</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">
                {Math.max(0, (level?.maxPoints || 100) - faithPoints)} points to next level
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="progress">
        <TabsList className="w-full">
          <TabsTrigger value="progress" className="flex-1">Progress</TabsTrigger>
          <TabsTrigger value="badges" className="flex-1">Badges ({badges.length})</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>

        {/* Progress / Activity Tab */}
        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <ProgressChart
                history={progress}
                faithPoints={faithPoints}
                memberLevel={profile?.member_level || 'new_member'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <BadgeDisplay badges={badges} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Interface Language</Label>
                <Select value={prefs.language} onValueChange={v => setPrefs(p => ({ ...p, language: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Default Bible Version</Label>
                <Select value={prefs.default_bible_version} onValueChange={v => setPrefs(p => ({ ...p, default_bible_version: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIBLE_VERSIONS.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSavePrefs}
                disabled={savingPrefs}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {savingPrefs ? 'Saving…' : 'Save Preferences'}
              </Button>

              <Separator />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive prayer updates and event reminders</p>
                </div>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const { requestNotificationPermission } = await import('@/lib/firebase.client');
                    await requestNotificationPermission();
                    toast.success('Notifications enabled!');
                  } catch {
                    toast.error('Could not enable notifications');
                  }
                }}>
                  <Bell className="h-3.5 w-3.5 mr-1" />Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Avatar Upload Modal ──────────────────────────────────────── */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <ImageUpload
              currentUrl={resolvedAvatar}
              onUploadComplete={handleAvatarUploaded}
              purpose="avatar"
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxMB={5}
              label="Choose Photo"
              shape="circle"
            />
          </div>
          <p className="text-xs text-center text-gray-400 pb-2">
            Drag &amp; drop or click the circle to select a photo.<br />
            Supports JPG, PNG, WebP · max 5 MB
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
