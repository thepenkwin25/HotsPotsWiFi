import { type User, type InsertUser, type Hotspot, type InsertHotspot, type Review, type InsertReview, type Photo, type InsertPhoto, type Favorite, type InsertFavorite } from "@shared/schema";
import { loadInitialData, importHotspotsFromCSV } from "./csv-import";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hotspot management
  getAllHotspots(): Promise<Hotspot[]>;
  getHotspotById(id: number): Promise<Hotspot | undefined>;
  createHotspot(hotspot: InsertHotspot): Promise<Hotspot>;
  searchHotspots(query: string): Promise<Hotspot[]>;
  getHotspotsNearLocation(lat: number, lng: number, radiusKm?: number): Promise<Hotspot[]>;
  getPendingHotspots(): Promise<Hotspot[]>;
  approveHotspot(id: number): Promise<void>;
  rejectHotspot(id: number): Promise<void>;
  importHotspotsFromData(hotspots: InsertHotspot[]): Promise<void>;
  
  // Reviews and ratings
  getReviewsForHotspot(hotspotId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateHotspotRating(hotspotId: number): Promise<void>;
  
  // Photos
  getPhotosForHotspot(hotspotId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  approvePhoto(photoId: number): Promise<void>;
  
  // Favorites
  getUserFavorites(userId: number): Promise<Hotspot[]>;
  addFavorite(favorite: InsertFavorite): Promise<void>;
  removeFavorite(userId: number, hotspotId: number): Promise<void>;
  isFavorite(userId: number, hotspotId: number): Promise<boolean>;
}

class WorkingStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private hotspots: Map<number, Hotspot> = new Map();
  private reviews: Map<number, Review> = new Map();
  private photos: Map<number, Photo> = new Map();
  private favorites: Map<string, Favorite> = new Map(); // key: "userId-hotspotId"
  private currentUserId = 1;
  private currentHotspotId = 1;
  private currentReviewId = 1;
  private currentPhotoId = 1;
  private currentFavoriteId = 1;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const csvData = await importHotspotsFromCSV('./server/data/hotspots_new_england.csv');
      await this.importHotspotsFromData(csvData);
      console.log(`Loaded ${csvData.length} New England hotspots from CSV data`);
    } catch (error) {
      console.error('Failed to load New England CSV data:', error);
      // Try original CSV as backup
      try {
        const fallbackData = await loadInitialData();
        await this.importHotspotsFromData(fallbackData);
        console.log(`Loaded ${fallbackData.length} hotspots from original CSV data`);
      } catch (fallbackError) {
        console.error('Failed to load any CSV data:', fallbackError);
      }
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllHotspots(): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values())
      .filter(hotspot => hotspot.moderationStatus === 'approved');
  }

  async getHotspotById(id: number): Promise<Hotspot | undefined> {
    return this.hotspots.get(id);
  }

  async createHotspot(insertHotspot: InsertHotspot): Promise<Hotspot> {
    const id = this.currentHotspotId++;
    const hotspot: Hotspot = { 
      ...insertHotspot,
      isFree: insertHotspot.isFree ?? true,
      wifiPassword: insertHotspot.wifiPassword ?? null,
      description: insertHotspot.description ?? null,
      isVerified: false,
      moderationStatus: "pending",
      submittedBy: insertHotspot.submittedBy ?? "user",
      averageRating: 0,
      reviewCount: 0,
      isSponsored: insertHotspot.isSponsored ?? false,
      id,
      createdAt: new Date()
    };
    this.hotspots.set(id, hotspot);
    return hotspot;
  }

  async searchHotspots(query: string): Promise<Hotspot[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.hotspots.values()).filter(hotspot =>
      hotspot.moderationStatus === 'approved' && (
        hotspot.name.toLowerCase().includes(lowerQuery) ||
        hotspot.address.toLowerCase().includes(lowerQuery) ||
        hotspot.category.toLowerCase().includes(lowerQuery)
      )
    );
  }

  async getHotspotsNearLocation(lat: number, lng: number, radiusKm: number = 10): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values()).filter(hotspot => {
      if (hotspot.moderationStatus !== 'approved') return false;
      const distance = this.calculateDistance(lat, lng, hotspot.latitude, hotspot.longitude);
      return distance <= radiusKm;
    });
  }

  async getPendingHotspots(): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values())
      .filter(hotspot => hotspot.moderationStatus === 'pending');
  }

  async approveHotspot(id: number): Promise<void> {
    const hotspot = this.hotspots.get(id);
    if (hotspot) {
      hotspot.moderationStatus = 'approved';
      this.hotspots.set(id, hotspot);
    }
  }

  async rejectHotspot(id: number): Promise<void> {
    const hotspot = this.hotspots.get(id);
    if (hotspot) {
      hotspot.moderationStatus = 'rejected';
      this.hotspots.set(id, hotspot);
    }
  }

  async importHotspotsFromData(hotspots: InsertHotspot[]): Promise<void> {
    hotspots.forEach(insertHotspot => {
      const id = this.currentHotspotId++;
      const hotspot: Hotspot = {
        ...insertHotspot,
        isFree: insertHotspot.isFree ?? true,
        wifiPassword: insertHotspot.wifiPassword ?? null,
        description: insertHotspot.description ?? null,
        isVerified: true,
        moderationStatus: "approved",
        submittedBy: "csv_import",
        averageRating: 0,
        reviewCount: 0,
        isSponsored: insertHotspot.isSponsored ?? false,
        id,
        createdAt: new Date()
      };
      this.hotspots.set(id, hotspot);
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Reviews and ratings methods
  async getReviewsForHotspot(hotspotId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.hotspotId === hotspotId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = {
      ...insertReview,
      status: 'approved',
      comment: insertReview.comment || null,
      photoUrl: insertReview.photoUrl || null,
      id,
      createdAt: new Date()
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateHotspotRating(hotspotId: number): Promise<void> {
    const reviews = await this.getReviewsForHotspot(hotspotId);
    const hotspot = this.hotspots.get(hotspotId);
    
    if (hotspot && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const updatedHotspot: Hotspot = {
        ...hotspot,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length
      };
      
      this.hotspots.set(hotspotId, updatedHotspot);
    }
  }

  // Photos methods
  async getPhotosForHotspot(hotspotId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.hotspotId === hotspotId && photo.approved === true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const photo: Photo = {
      ...insertPhoto,
      approved: false,
      id,
      createdAt: new Date()
    };
    this.photos.set(id, photo);
    return photo;
  }

  async approvePhoto(photoId: number): Promise<void> {
    const photo = this.photos.get(photoId);
    if (photo) {
      const updatedPhoto: Photo = {
        ...photo,
        approved: true
      };
      this.photos.set(photoId, updatedPhoto);
    }
  }

  // Favorites methods
  async getUserFavorites(userId: number): Promise<Hotspot[]> {
    const userFavorites = Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId);
    
    const favoriteHotspots: Hotspot[] = [];
    for (const favorite of userFavorites) {
      const hotspot = this.hotspots.get(favorite.hotspotId);
      if (hotspot && hotspot.moderationStatus === 'approved') {
        favoriteHotspots.push(hotspot);
      }
    }
    
    return favoriteHotspots;
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<void> {
    const key = `${insertFavorite.userId}-${insertFavorite.hotspotId}`;
    
    // Check if already exists
    if (this.favorites.has(key)) {
      return;
    }
    
    const id = this.currentFavoriteId++;
    const favorite: Favorite = {
      ...insertFavorite,
      id,
      createdAt: new Date()
    };
    
    this.favorites.set(key, favorite);
  }

  async removeFavorite(userId: number, hotspotId: number): Promise<void> {
    const key = `${userId}-${hotspotId}`;
    this.favorites.delete(key);
  }

  async isFavorite(userId: number, hotspotId: number): Promise<boolean> {
    const key = `${userId}-${hotspotId}`;
    return this.favorites.has(key);
  }
}

export const storage = new WorkingStorage();