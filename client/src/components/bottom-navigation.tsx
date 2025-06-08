import { Map, List, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  currentView: "map" | "list" | "favorites";
  onViewChange: (view: "map" | "list" | "favorites") => void;
}

export default function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { id: "map" as const, icon: Map, label: "Map" },
    { id: "list" as const, icon: List, label: "List" },
    { id: "favorites" as const, icon: Heart, label: "Saved" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            className={`flex flex-col items-center py-3 px-4 h-auto space-y-1 ${
              currentView === id 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            }`}
            onClick={() => onViewChange(id)}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
