import { create } from 'zustand';

interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
  max_members: number;
  is_public: number;
  member_count?: number;
}

interface GroupsStore {
  groups: Group[];
  myGroupIds: Set<number>;
  loading: boolean;
  fetchGroups: () => Promise<void>;
  joinGroup: (id: number) => void;
}

export const useGroupsStore = create<GroupsStore>((set, get) => ({
  groups: [],
  myGroupIds: new Set(),
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      set({ groups: data.groups || [] });
    } finally {
      set({ loading: false });
    }
  },

  joinGroup: (id) => {
    set(state => ({
      myGroupIds: new Set([...state.myGroupIds, id]),
    }));
  },
}));
