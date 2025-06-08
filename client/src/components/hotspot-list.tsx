import { Hotspot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, MapPin, Clock, Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

interface HotspotListProps {
  hotspots: Hotspot[];
  isLoading: boolean;
  onHotspotSelect: (hotspot: Hotspot) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

export default function HotspotList({ hotspots, isLoading, onHotspotSelect, userLocation }: HotspotListProps) {
  const { isFavorite } = useFavorites();
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-3" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hotspots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No HotsPots Found</h2>
          <p className="text-muted-foreground">Try adjusting your search or location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Nearby WiFi HotsPots</h2>
        <span className="text-sm text-muted-foreground">{hotspots.length} found</span>
      </div>

      {hotspots.map((hotspot) => {
        const distance = userLocation
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              hotspot.latitude,
              hotspot.longitude
            )
          : null;

        return (
          <Card
            key={hotspot.id}
            className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
            onClick={() => onHotspotSelect(hotspot)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{hotspot.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{hotspot.address}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <Badge
                      variant={hotspot.isFree ? "default" : "secondary"}
                      className={hotspot.isFree ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}
                    >
                      <Wifi className="h-3 w-3 mr-1" />
                      {hotspot.isFree ? "Free WiFi" : "Paid WiFi"}
                    </Badge>
                    <span className="flex items-center text-xs text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground mr-1" />
                      {hotspot.category}
                    </span>
                    {distance && (
                      <span className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {formatDistance(distance)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {isFavorite(hotspot.id) && (
                    <Heart className="h-4 w-4 fill-current text-red-500" />
                  )}
                  <div className={`w-3 h-3 rounded-full ${hotspot.isFree ? 'bg-secondary' : 'bg-accent'}`} />
                  <span className="text-xs text-muted-foreground">
                    {hotspot.isFree ? "Free" : "Paid"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
