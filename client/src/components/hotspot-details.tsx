import { Hotspot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Wifi, MapPin, Clock, X, Navigation, Share2, Key, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/lib/favorites";
import { analytics } from "@/lib/analytics";

interface HotspotDetailsProps {
  hotspot: Hotspot;
  isOpen: boolean;
  onClose: () => void;
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
    return `${Math.round(distance * 1000)} meters away`;
  }
  return `${distance.toFixed(1)} km away`;
}

export default function HotspotDetails({ hotspot, isOpen, onClose, userLocation }: HotspotDetailsProps) {
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hotspot.latitude,
        hotspot.longitude
      )
    : null;

  const handleGetDirections = () => {
    analytics.trackDirectionsRequest(hotspot.id);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    analytics.trackHotspotShare(hotspot.id);
    const shareData = {
      title: hotspot.name,
      text: `Check out this WiFi hotspot: ${hotspot.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${hotspot.name} - ${hotspot.address}`);
        toast({
          title: "Copied to clipboard",
          description: "Hotspot details copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Unable to share this hotspot",
        variant: "destructive",
      });
    }
  };

  const handleFavoriteToggle = () => {
    const newFavoriteState = !isFavorite(hotspot.id);
    toggleFavorite(hotspot.id);
    analytics.trackFavoriteToggle(hotspot.id, newFavoriteState);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-96 rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hotspot.isFree ? 'bg-secondary' : 'bg-accent'} text-white`}>
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-left">{hotspot.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{hotspot.category}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-accent flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{hotspot.address}</span>
          </div>

          <div className="flex items-center space-x-3">
            <Wifi className={`h-5 w-5 flex-shrink-0 ${hotspot.isFree ? 'text-secondary' : 'text-accent'}`} />
            <div className="flex items-center space-x-2">
              <Badge
                variant={hotspot.isFree ? "default" : "secondary"}
                className={hotspot.isFree ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}
              >
                {hotspot.isFree ? "Free WiFi Available" : "Paid WiFi"}
              </Badge>
              {!hotspot.isFree && hotspot.wifiPassword && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Key className="h-3 w-3 mr-1" />
                  Password required
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Open 24 hours</span>
          </div>

          {distance && (
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{formatDistance(distance)}</span>
            </div>
          )}

          {hotspot.description && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">{hotspot.description}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90" 
              onClick={handleGetDirections}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
            <Button 
              variant="outline" 
              onClick={handleFavoriteToggle}
              className="px-4"
            >
              <Heart className={`h-4 w-4 ${isFavorite(hotspot.id) ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="px-4"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
