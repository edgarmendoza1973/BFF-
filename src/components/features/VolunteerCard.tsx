'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface VolunteerOpportunity {
  id: number;
  title: string;
  description?: string;
  department?: string;
  date_time?: string;
  location?: string;
  spots_available?: number;
  spots_filled?: number;
  is_signed_up?: boolean;
}

interface VolunteerCardProps {
  opportunity: VolunteerOpportunity;
  isSigningUp?: boolean;
  onSignUp?: (id: number) => void;
}

export function VolunteerCard({ opportunity, isSigningUp, onSignUp }: VolunteerCardProps) {
  const isFull = opportunity.spots_available !== undefined &&
    (opportunity.spots_filled || 0) >= opportunity.spots_available;
  const spotsLeft = opportunity.spots_available
    ? opportunity.spots_available - (opportunity.spots_filled || 0)
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🤝
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{opportunity.title}</h3>
              {opportunity.is_signed_up && (
                <Badge className="text-xs bg-green-100 text-green-700 border-0 shrink-0">
                  <Check className="h-2.5 w-2.5 mr-0.5" />Signed Up
                </Badge>
              )}
            </div>

            {opportunity.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{opportunity.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
              {opportunity.department && (
                <Badge variant="outline" className="text-xs">{opportunity.department}</Badge>
              )}
              {opportunity.date_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(opportunity.date_time), 'MMM d, yyyy h:mm a')}
                </span>
              )}
              {opportunity.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{opportunity.location}
                </span>
              )}
              {spotsLeft !== null && (
                <span className={`flex items-center gap-1 ${spotsLeft <= 3 ? 'text-orange-500' : ''}`}>
                  <Users className="h-3 w-3" />
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                </span>
              )}
            </div>

            {!opportunity.is_signed_up && onSignUp && (
              <Button
                size="sm"
                className="mt-3 bg-green-600 hover:bg-green-700 h-7 text-xs"
                disabled={isSigningUp || isFull}
                onClick={() => onSignUp(opportunity.id)}
              >
                {isSigningUp
                  ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Signing up…</>
                  : isFull ? 'Full' : 'Sign Up'
                }
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
