import { useEffect, useState } from "react";
import { Hotspot } from "@shared/schema";
import { Wifi, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MapProps {
  hotspots: Hotspot[];
  userLocation: { latitude: number; longitude: number } | null;
  selectedHotspot: Hotspot | null;
  onHotspotSelect: (hotspot: Hotspot) => void;
  onLocationRequest: () => void;
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

export default function Map({ hotspots, userLocation, selectedHotspot, onHotspotSelect }: MapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  
  useEffect(() => {
    if (userLocation) {
      setMapCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  }, [userLocation]);

  useEffect(() => {
    if (selectedHotspot) {
      setMapCenter({ lat: selectedHotspot.latitude, lng: selectedHotspot.longitude });
    }
  }, [selectedHotspot]);

  const handleGetDirections = (hotspot: Hotspot) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full w-full bg-muted/20 relative">
      {/* Map Placeholder with Grid Pattern */}
      <div className="h-full w-full relative overflow-hidden" style={{
        backgroundImage: `
          linear-gradient(rgba(203, 213, 225, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(203, 213, 225, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}>
        
        {/* User Location Indicator */}
        {userLocation && (
          <div 
            className="absolute w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg border-2 border-white z-20"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
          </div>
        )}

        {/* Hotspot Markers */}
        {hotspots.map((hotspot, index) => {
          const distance = userLocation
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                hotspot.latitude,
                hotspot.longitude
              )
            : null;

          // Position markers relative to center
          const offsetX = (hotspot.longitude - mapCenter.lng) * 1000;
          const offsetY = (mapCenter.lat - hotspot.latitude) * 1000;
          
          return (
            <div
              key={hotspot.id}
              className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${Math.max(-200, Math.min(200, offsetX))}px)`,
                top: `calc(50% + ${Math.max(-200, Math.min(200, offsetY))}px)`
              }}
              onClick={() => onHotspotSelect(hotspot)}
            >
              <div className="relative group">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 ${
                    hotspot.isFree ? 'bg-secondary' : 'bg-accent'
                  }`}
                >
                  <Wifi className="h-4 w-4" />
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <Card className="min-w-48 shadow-lg">
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm mb-1">{hotspot.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{hotspot.address}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
                          {hotspot.category}
                        </span>
                        <span className={`text-xs font-medium ${hotspot.isFree ? 'text-secondary' : 'text-accent'}`}>
                          {hotspot.isFree ? 'Free' : 'Paid'}
                        </span>
                      </div>
                      {distance && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistance(distance)} away
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map Attribution */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          Map placeholder - Click markers to view details
        </div>

        {/* Center Crosshair */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30">
          <MapPin className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
