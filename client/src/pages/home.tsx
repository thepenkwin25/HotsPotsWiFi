import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Map from "@/components/map";
import SearchBar from "@/components/search-bar";
import HotspotList from "@/components/hotspot-list";
import HotspotDetails from "@/components/hotspot-details";
import AddHotspotModal from "@/components/add-hotspot-modal";
import BottomNavigation from "@/components/bottom-navigation";
import InstallPrompt from "@/components/install-prompt";

import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/lib/geolocation";
import { useFavorites } from "@/lib/favorites";
import { analytics } from "@/lib/analytics";
import { Hotspot } from "@shared/schema";
import { Wifi, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentView, setCurrentView] = useState<"map" | "list" | "favorites">("map");
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  const { favorites, isFavorite } = useFavorites();

  // Fetch all hotspots
  const { data: allHotspots = [], isLoading, error } = useQuery<Hotspot[]>({
    queryKey: ["/api/hotspots"],
  });

  // Search hotspots when query changes
  const { data: searchResults, isLoading: searchLoading } = useQuery<Hotspot[]>({
    queryKey: ["/api/hotspots/search", searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: async () => {
      const response = await fetch(`/api/hotspots/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      analytics.trackSearch(searchQuery, results.length);
      return results;
    },
  });

  // Get nearby hotspots when location is available
  const { data: nearbyHotspots } = useQuery<Hotspot[]>({
    queryKey: ["/api/hotspots/near", location?.latitude, location?.longitude],
    enabled: !!location,
    queryFn: async () => {
      if (!location) return [];
      const response = await fetch(`/api/hotspots/near/${location.latitude}/${location.longitude}`);
      if (!response.ok) throw new Error("Failed to fetch nearby hotspots");
      return response.json();
    },
  });

  // Determine which hotspots to display
  const displayHotspots = currentView === "favorites"
    ? allHotspots.filter(hotspot => isFavorite(hotspot.id))
    : searchQuery.length > 2 
      ? searchResults || [] 
      : nearbyHotspots || allHotspots;

  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Error",
        description: "Unable to access your location. Please enable location services.",
        variant: "destructive",
      });
    }
  }, [locationError, toast]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Wifi className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Unable to Load HotsPots</h1>
          <p className="text-muted-foreground">Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg relative z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo-hots-pots.svg" alt="HotsPots Logo" className="h-8 w-8" />
              <h1 className="text-xl font-medium">HotsPots</h1>
            </div>
            {locationLoading && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="absolute top-20 left-4 right-4 z-40">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onLocationRequest={getCurrentLocation}
          isLoading={searchLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {currentView === "map" && (
          <Map
            hotspots={displayHotspots}
            userLocation={location}
            selectedHotspot={selectedHotspot}
            onHotspotSelect={setSelectedHotspot}
            onLocationRequest={getCurrentLocation}
          />
        )}
        
        {currentView === "list" && (
          <div className="h-full overflow-y-auto pt-16 pb-20">
            <HotspotList
              hotspots={displayHotspots}
              isLoading={isLoading}
              onHotspotSelect={setSelectedHotspot}
              userLocation={location}
            />
          </div>
        )}

        {currentView === "favorites" && (
          <div className="h-full flex items-center justify-center pt-16 pb-20">
            <div className="text-center">
              <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Saved HotsPots</h2>
              <p className="text-muted-foreground">Feature coming soon!</p>
            </div>
          </div>
        )}

        {/* FAB */}
        <Button
          className="fab-button fixed bottom-20 right-4 h-14 w-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg z-30"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Location button for map view */}
        {currentView === "map" && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-32 right-4 z-30 bg-background/95 backdrop-blur-sm"
            onClick={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Hotspot Details Sheet */}
      {selectedHotspot && (
        <HotspotDetails
          hotspot={selectedHotspot}
          isOpen={!!selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
          userLocation={location}
        />
      )}

      {/* Add Hotspot Modal */}
      <AddHotspotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userLocation={location}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
