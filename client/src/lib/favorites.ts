import { useState, useEffect } from "react";

const FAVORITES_KEY = "hotspots-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.warn("Failed to parse favorites from localStorage");
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (hotspotId: number) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(hotspotId)
        ? prev.filter(id => id !== hotspotId)
        : [...prev, hotspotId];
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (hotspotId: number) => favorites.includes(hotspotId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}