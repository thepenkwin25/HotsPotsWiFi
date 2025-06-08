-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Create hotspots table
CREATE TABLE IF NOT EXISTS hotspots (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  wifi_password TEXT,
  description TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  submitted_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_hotspots_location ON hotspots (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotspots_moderation ON hotspots (moderation_status);

-- Create function for nearby hotspots search
CREATE OR REPLACE FUNCTION get_nearby_hotspots(user_lat REAL, user_lng REAL, radius_km REAL DEFAULT 10)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  address TEXT,
  category TEXT,
  latitude REAL,
  longitude REAL,
  is_free BOOLEAN,
  wifi_password TEXT,
  description TEXT,
  is_verified BOOLEAN,
  moderation_status TEXT,
  submitted_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT h.id, h.name, h.address, h.category, h.latitude, h.longitude,
         h.is_free, h.wifi_password, h.description, h.is_verified,
         h.moderation_status, h.submitted_by, h.created_at
  FROM hotspots h
  WHERE h.moderation_status = 'approved'
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(h.latitude)) *
        cos(radians(h.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(h.latitude))
      )
    ) <= radius_km
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql;
