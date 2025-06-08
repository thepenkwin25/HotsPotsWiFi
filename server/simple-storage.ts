import { type User, type InsertUser, type Hotspot, type InsertHotspot } from "@shared/schema";
import { IStorage } from "./storage";
import { loadInitialData } from "./csv-import";

export class SimpleStorage implements IStorage {
  private users: Map<number, User>;
  private hotspots: Map<number, Hotspot>;
  private currentUserId: number;
  private currentHotspotId: number;

  constructor() {
    this.users = new Map();
    this.hotspots = new Map();
    this.currentUserId = 1;
    this.currentHotspotId = 1;
    
    this.initializeData();
  }

  private async initializeData() {
    try {
      const csvHotspots = await loadInitialData();
      await this.importHotspotsFromData(csvHotspots);
      console.log(`Initialized storage with ${csvHotspots.length} hotspots from CSV`);
    } catch (error) {
      console.warn('CSV import failed, using fallback data:', error);
      this.createFallbackData();
    }
  }

  private createFallbackData() {
    const fallbackHotspots: Omit<Hotspot, 'id'>[] = [
      {
        name: "Starbucks Coffee",
        address: "123 Market St, San Francisco, CA",
        category: "Coffee Shop",
        latitude: 37.7749,
        longitude: -122.4194,
        isFree: true,
        wifiPassword: null,
        description: "Free WiFi with purchase",
        isVerified: true,
        moderationStatus: "approved",
        submittedBy: "admin",
        createdAt: new Date(),
      },
      {
        name: "San Francisco Public Library",
        address: "100 Larkin St, San Francisco, CA",
        category: "Library", 
        latitude: 37.7793,
        longitude: -122.4161,
        isFree: true,
        wifiPassword: null,
        description: "High-speed public internet access",
        isVerified: true,
        moderationStatus: "approved",
        submittedBy: "admin",
        createdAt: new Date(),
      }
    ];

    fallbackHotspots.forEach((hotspot) => {
      const id = this.currentHotspotId++;
      this.hotspots.set(id, { ...hotspot, id });
    });
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
      submittedBy: "user",
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
}