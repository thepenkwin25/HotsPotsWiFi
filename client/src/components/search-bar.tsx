import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onLocationRequest: () => void;
  isLoading?: boolean;
}

export default function SearchBar({ value, onChange, onLocationRequest, isLoading }: SearchBarProps) {
  return (
    <div className="floating-search bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20">
      <div className="flex items-center p-4 space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search city, zip code, or business..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 bg-muted border-muted-foreground/20 focus:border-primary"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant="default"
          size="icon"
          onClick={onLocationRequest}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
