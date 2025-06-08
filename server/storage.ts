import { type User, type InsertUser, type Hotspot, type InsertHotspot } from "@shared/schema";
import { SimpleStorage } from "./simple-storage";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllHotspots(): Promise<Hotspot[]>;
  getHotspotById(id: number): Promise<Hotspot | undefined>;
  createHotspot(hotspot: InsertHotspot): Promise<Hotspot>;
  searchHotspots(query: string): Promise<Hotspot[]>;
  getHotspotsNearLocation(lat: number, lng: number, radiusKm?: number): Promise<Hotspot[]>;
  getPendingHotspots(): Promise<Hotspot[]>;
  approveHotspot(id: number): Promise<void>;
  rejectHotspot(id: number): Promise<void>;
  importHotspotsFromData(hotspots: InsertHotspot[]): Promise<void>;
}

async function createStorage(): Promise<IStorage> {
  // Use Supabase if DATABASE_URL is available, otherwise fall back to SimpleStorage
  if (process.env.DATABASE_URL) {
    try {
      const { SupabaseStorage } = await import("./supabase-storage");
      console.log("Using Supabase storage with database");
      return new SupabaseStorage();
    } catch (error) {
      console.error("Failed to initialize Supabase storage:", error);
      console.log("Falling back to SimpleStorage");
    }
  }
  
  console.log("Using SimpleStorage with CSV data");
  return new SimpleStorage();
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private hotspots: Map<number, Hotspot>;
  private currentUserId: number;
  private currentHotspotId: number;

  constructor() {
    this.users = new Map();
    this.hotspots = new Map();
    this.currentUserId = 1;
    this.currentHotspotId = 1;
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleHotspots: Omit<Hotspot, 'id'>[] = [
      {
        name: "Starbucks Coffee",
        address: "123 Market Street, San Francisco, CA 94102",
        category: "Coffee Shop",
        latitude: 37.7749,
        longitude: -122.4194,
        isFree: true,
        wifiPassword: null,
        description: "Free WiFi for customers. Password available at counter.",
        createdAt: new Date(),
      },
      {
        name: "McDonald's",
        address: "456 Mission Street, San Francisco, CA 94105",
        category: "Restaurant",
        latitude: 37.7849,
        longitude: -122.4094,
        isFree: true,
        wifiPassword: null,
        description: "Free WiFi, no password required.",
        createdAt: new Date(),
      },
      {
        name: "Public Library",
        address: "100 Larkin Street, San Francisco, CA 94102",
        category: "Library",
        latitude: 37.7649,
        longitude: -122.4294,
        isFree: true,
        wifiPassword: null,
        description: "Free public WiFi. Library card not required for internet access.",
        createdAt: new Date(),
      },
      {
        name: "Union Square",
        address: "333 Post Street, San Francisco, CA 94108",
        category: "Public Space",
        latitude: 37.7879,
        longitude: -122.4075,
        isFree: true,
        wifiPassword: null,
        description: "Free public WiFi in the square area.",
        createdAt: new Date(),
      },
      {
        name: "Hotel Zephyr",
        address: "Pier 39, San Francisco, CA 94133",
        category: "Hotel",
        latitude: 37.8085,
        longitude: -122.4098,
        isFree: false,
        wifiPassword: "guest123",
        description: "WiFi available for guests. Day passes available for purchase.",
        createdAt: new Date(),
      },
      {
        name: "Whole Foods Market",
        address: "1765 California Street, San Francisco, CA 94109",
        category: "Grocery Store",
        latitude: 37.7899,
        longitude: -122.4244,
        isFree: true,
        wifiPassword: null,
        description: "Free WiFi for customers throughout the store.",
        createdAt: new Date(),
      }
    ];

    sampleHotspots.forEach(hotspot => {
      const id = this.currentHotspotId++;
      this.hotspots.set(id, { ...hotspot, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllHotspots(): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values());
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
      id,
      createdAt: new Date()
    };
    this.hotspots.set(id, hotspot);
    return hotspot;
  }

  async searchHotspots(query: string): Promise<Hotspot[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.hotspots.values()).filter(hotspot =>
      hotspot.name.toLowerCase().includes(lowerQuery) ||
      hotspot.address.toLowerCase().includes(lowerQuery) ||
      hotspot.category.toLowerCase().includes(lowerQuery)
    );
  }

  async getHotspotsNearLocation(lat: number, lng: number, radiusKm: number = 10): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values()).filter(hotspot => {
      const distance = this.calculateDistance(lat, lng, hotspot.latitude, hotspot.longitude);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
}

// Export storage instance that will be initialized asynchronously
let storageInstance: IStorage;

export async function initializeStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

export { storageInstance as storage };
