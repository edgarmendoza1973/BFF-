'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, CheckCircle, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  audience_type?: string;
  rsvp_count?: number;
  max_attendees?: number;
}

interface EventCardProps {
  event: Event;
  isGoing?: boolean;
  canShowQR?: boolean;
  onRSVP?: (id: number) => void;
  onShowQR?: (event: Event) => void;
  onCheckin?: (event: Event) => void;
}

export function EventCard({ event, isGoing, canShowQR, onRSVP, onShowQR, onCheckin }: EventCardProps) {
  const isPast = new Date(event.event_date) < new Date();
  const isFull = event.max_attendees && (event.rsvp_count || 0) >= event.max_attendees;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
        <span className="text-white text-4xl">📅</span>
        {!isPast && canShowQR && onShowQR && (
          <button
            onClick={() => onShowQR(event)}
            className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1"
          >
            <QrCode className="h-3 w-3" /> QR
          </button>
        )}
        {isPast && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Badge className="bg-black/50 text-white border-0">Past Event</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{event.rsvp_count || 0} going
            {event.max_attendees && ` / ${event.max_attendees}`}
          </span>
        </div>

        {!isPast && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant={isGoing ? 'outline' : 'default'}
              className={isGoing ? 'text-green-600 border-green-200' : 'bg-indigo-600 hover:bg-indigo-700'}
              onClick={() => onRSVP?.(event.id)}
              disabled={!isGoing && !!isFull}
            >
              {isGoing
                ? <><CheckCircle className="h-3.5 w-3.5 mr-1" />Going</>
                : isFull ? 'Full' : 'RSVP'
              }
            </Button>
            {isGoing && onCheckin && (
              <Button size="sm" variant="outline" onClick={() => onCheckin(event)}>
                <QrCode className="h-3.5 w-3.5 mr-1" />Check In
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
