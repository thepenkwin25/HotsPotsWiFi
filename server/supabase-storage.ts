import { supabase, type DatabaseHotspot, type DatabaseUser } from './supabase';
import { type User, type InsertUser, type Hotspot, type InsertHotspot } from '@shared/schema';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapDatabaseUserToUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return this.mapDatabaseUserToUser(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: insertUser.username,
        password: insertUser.password,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapDatabaseUserToUser(data);
  }

  // Hotspot methods
  async getAllHotspots(): Promise<Hotspot[]> {
    const { data, error } = await supabase
      .from('hotspots')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch hotspots: ${error.message}`);
    return data.map(this.mapDatabaseHotspotToHotspot);
  }

  async getHotspotById(id: number): Promise<Hotspot | undefined> {
    const { data, error } = await supabase
      .from('hotspots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return this.mapDatabaseHotspotToHotspot(data);
  }

  async createHotspot(insertHotspot: InsertHotspot): Promise<Hotspot> {
    const { data, error } = await supabase
      .from('hotspots')
      .insert({
        name: insertHotspot.name,
        address: insertHotspot.address,
        category: insertHotspot.category,
        latitude: insertHotspot.latitude,
        longitude: insertHotspot.longitude,
        is_free: insertHotspot.isFree ?? true,
        wifi_password: insertHotspot.wifiPassword,
        description: insertHotspot.description,
        is_verified: false,
        moderation_status: 'pending',
        submitted_by: null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create hotspot: ${error.message}`);
    return this.mapDatabaseHotspotToHotspot(data);
  }

  async searchHotspots(query: string): Promise<Hotspot[]> {
    const { data, error } = await supabase
      .from('hotspots')
      .select('*')
      .eq('moderation_status', 'approved')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to search hotspots: ${error.message}`);
    return data.map(this.mapDatabaseHotspotToHotspot);
  }

  async getHotspotsNearLocation(lat: number, lng: number, radiusKm: number = 10): Promise<Hotspot[]> {
    // Using Haversine formula for distance calculation in SQL
    const { data, error } = await supabase.rpc('get_nearby_hotspots', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm
    });

    if (error) {
      // Fallback to getting all hotspots and filtering in memory
      console.warn('Nearby hotspots RPC failed, using fallback:', error.message);
      const allHotspots = await this.getAllHotspots();
      return allHotspots.filter(hotspot => {
        const distance = this.calculateDistance(lat, lng, hotspot.latitude, hotspot.longitude);
        return distance <= radiusKm;
      });
    }

    return data.map(this.mapDatabaseHotspotToHotspot);
  }

  // Moderation methods
  async getPendingHotspots(): Promise<Hotspot[]> {
    const { data, error } = await supabase
      .from('hotspots')
      .select('*')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch pending hotspots: ${error.message}`);
    return data.map(this.mapDatabaseHotspotToHotspot);
  }

  async approveHotspot(id: number): Promise<void> {
    const { error } = await supabase
      .from('hotspots')
      .update({ moderation_status: 'approved' })
      .eq('id', id);

    if (error) throw new Error(`Failed to approve hotspot: ${error.message}`);
  }

  async rejectHotspot(id: number): Promise<void> {
    const { error } = await supabase
      .from('hotspots')
      .update({ moderation_status: 'rejected' })
      .eq('id', id);

    if (error) throw new Error(`Failed to reject hotspot: ${error.message}`);
  }

  async importHotspotsFromData(hotspots: InsertHotspot[]): Promise<void> {
    const databaseHotspots = hotspots.map(hotspot => ({
      name: hotspot.name,
      address: hotspot.address,
      category: hotspot.category,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      is_free: hotspot.isFree ?? true,
      wifi_password: hotspot.wifiPassword,
      description: hotspot.description,
      is_verified: true, // CSV imported data is pre-verified
      moderation_status: 'approved' as const,
      submitted_by: 'csv_import',
    }));

    const { error } = await supabase
      .from('hotspots')
      .upsert(databaseHotspots, { onConflict: 'name,address' });

    if (error) throw new Error(`Failed to import hotspots: ${error.message}`);
  }

  // Helper methods
  private mapDatabaseUserToUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password,
    };
  }

  private mapDatabaseHotspotToHotspot(dbHotspot: DatabaseHotspot): Hotspot {
    return {
      id: dbHotspot.id,
      name: dbHotspot.name,
      address: dbHotspot.address,
      category: dbHotspot.category,
      latitude: dbHotspot.latitude,
      longitude: dbHotspot.longitude,
      isFree: dbHotspot.is_free,
      wifiPassword: dbHotspot.wifi_password,
      description: dbHotspot.description,
      isVerified: dbHotspot.is_verified,
      moderationStatus: dbHotspot.moderation_status,
      submittedBy: dbHotspot.submitted_by,
      createdAt: new Date(dbHotspot.created_at),
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
}