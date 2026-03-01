import { create } from 'zustand';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (isLoading) => set({ isLoading }),
  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        set({
          notifications: data.notifications,
          unreadCount: data.notifications.filter((n: Notification) => !n.read).length,
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  markAsRead: async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      set({
        notifications: get().notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },
  markAllRead: async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },
  clearAll: async () => {
    try {
      await fetch('/api/notifications/clear-all', { method: 'DELETE' });
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  },
}));
