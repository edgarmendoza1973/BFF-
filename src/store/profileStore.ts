import { create } from 'zustand';

interface Profile {
  display_name: string;
  bio: string;
  phone: string;
  profile_pic: string;
  member_level: string;
  faith_points: number;
  language: string;
  default_bible_version: string;
  onboarding_completed: number;
  notification_preferences: string;
}

interface ProfileStore {
  profile: Profile | null;
  badges: any[];
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  badges: [],
  loading: false,

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      set({ profile: data.profile, badges: data.badges || [] });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      set(state => ({
        profile: state.profile ? { ...state.profile, ...data } : null,
      }));
    }
  },
}));
