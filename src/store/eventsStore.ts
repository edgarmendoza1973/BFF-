import { create } from 'zustand';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  audience_type: string;
  rsvp_count: number;
}

interface EventsStore {
  events: Event[];
  loading: boolean;
  rsvpedIds: Set<number>;
  fetchEvents: () => Promise<void>;
  rsvpEvent: (id: number) => void;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  loading: false,
  rsvpedIds: new Set(),

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      set({ events: data.events || [] });
    } finally {
      set({ loading: false });
    }
  },

  rsvpEvent: (id) => {
    set(state => ({
      rsvpedIds: new Set([...state.rsvpedIds, id]),
      events: state.events.map(e => e.id === id ? { ...e, rsvp_count: e.rsvp_count + 1 } : e),
    }));
  },
}));
