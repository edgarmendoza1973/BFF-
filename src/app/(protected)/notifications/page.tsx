"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Calendar, Users, BookOpen, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: number;
  created_at: string;
  data?: any;
}

const NOTIF_ICONS: Record<string, any> = {
  chat: MessageCircle,
  events: Calendar,
  group: Users,
  journal: BookOpen,
  prayer: Heart,
  default: Bell,
};

const NOTIF_COLORS: Record<string, string> = {
  chat: 'text-blue-500',
  events: 'text-green-500',
  group: 'text-purple-500',
  journal: 'text-amber-500',
  prayer: 'text-red-500',
  default: 'text-gray-500',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const clearAll = async () => {
    try {
      await fetch('/api/notifications/clear-all', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  const NotifItem = ({ notif }: { notif: Notification }) => {
    const Icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
    const iconColor = NOTIF_COLORS[notif.type] || NOTIF_COLORS.default;

    return (
      <div
        className={`flex gap-3 p-4 border-b last:border-0 cursor-pointer transition-colors hover:bg-gray-50 ${
          !notif.read ? 'bg-blue-50/50' : ''
        }`}
        onClick={() => !notif.read && markRead(notif.id)}
      >
        <div className={`mt-0.5 shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-1`}>
              {notif.title}
            </p>
            {!notif.read && (
              <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            )}
          </div>
          {notif.body && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{notif.body}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-sm text-gray-500">Stay up to date with your community</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="outline" onClick={clearAll} className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <Card>
            {loading ? (
              <div className="p-8 text-center">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : unread.length === 0 ? (
              <CardContent className="py-16 text-center text-gray-500">
                <Check className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No unread notifications</p>
              </CardContent>
            ) : (
              <div>
                {unread.map(n => <NotifItem key={n.id} notif={n} />)}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            {notifications.length === 0 ? (
              <CardContent className="py-16 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </CardContent>
            ) : (
              <div>
                {notifications.map(n => <NotifItem key={n.id} notif={n} />)}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
