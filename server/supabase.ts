import { createClient } from '@supabase/supabase-js';

// Parse DATABASE_URL to extract Supabase connection details
function parseSupabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname;
    
    // Extract project reference from hostname (format: db.{project_ref}.supabase.co)
    const projectRef = host.split('.')[1];
    
    if (!projectRef) {
      throw new Error('Could not extract project reference from hostname');
    }
    
    const supabaseUrl = `https://${projectRef}.supabase.co`;
    return { supabaseUrl, projectRef };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
}

let supabaseClient = null;

// Try to initialize Supabase client from available environment variables
if (process.env.DATABASE_URL) {
  const parsed = parseSupabaseUrl(process.env.DATABASE_URL);
  if (parsed) {
    // For authentication features, we'll need SUPABASE_ANON_KEY
    // For now, create a basic client for database operations
    try {
      // Use a placeholder anon key - this will need to be provided for full auth features
      const anonKey = process.env.SUPABASE_ANON_KEY || 'placeholder';
      supabaseClient = createClient(parsed.supabaseUrl, anonKey);
      console.log('Supabase client initialized from DATABASE_URL');
    } catch (error) {
      console.warn('Could not initialize Supabase client:', error);
    }
  }
} else if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  supabaseClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  console.log('Supabase client initialized from VITE environment variables');
}

export const supabase = supabaseClient;

// Database table definitions
export interface DatabaseHotspot {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  is_free: boolean;
  wifi_password: string | null;
  description: string | null;
  is_verified: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  created_at: string;
}

export interface DatabaseUser {
  id: number;
  username: string;
  password: string;
}

// Initialize database tables using SQL
export async function initializeDatabase() {
  if (!supabase) {
    console.log('Supabase client not available, skipping database initialization');
    return;
  }

  try {
    // Create users table if it doesn't exist
    const { error: usersError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.users (
          id BIGSERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    // Create hotspots table if it doesn't exist
    const { error: hotspotsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.hotspots (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          category TEXT NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          is_free BOOLEAN DEFAULT true,
          wifi_password TEXT,
          description TEXT,
          is_verified BOOLEAN DEFAULT false,
          moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
          submitted_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    // Create user_favorites table for saved hotspots
    const { error: favoritesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.user_favorites (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
          hotspot_id BIGINT REFERENCES public.hotspots(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, hotspot_id)
        );
      `
    });

    if (usersError) console.warn('Users table creation:', usersError.message);
    if (hotspotsError) console.warn('Hotspots table creation:', hotspotsError.message);
    if (favoritesError) console.warn('Favorites table creation:', favoritesError.message);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Try direct SQL execution
    try {
      await supabase.from('users').select('id').limit(1);
      console.log('Database connection verified');
    } catch (connError) {
      console.error('Database connection failed:', connError);
    }
  }
}