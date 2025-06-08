import { supabase } from './supabaseClient';

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('hotspots').select('*');
    if (error) {
      console.error('Error fetching hotspots:', error);
    } else {
      console.log('Hotspots fetched successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSupabaseConnection();
