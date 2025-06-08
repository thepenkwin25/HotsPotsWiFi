import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { InsertHotspot } from '@shared/schema';

export interface CSVHotspot {
  name: string;
  address: string;
  category: string;
  latitude: string;
  longitude: string;
  isFree: string;
  wifiPassword?: string;
  description?: string;
  isVerified?: string;
  moderationStatus?: string;
  submittedBy?: string;
}

export function parseHotspotFromCSV(row: CSVHotspot): InsertHotspot {
  return {
    name: row.name.trim(),
    address: row.address.trim(),
    category: row.category.trim(),
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    isFree: row.isFree.toLowerCase() === 'true',
    wifiPassword: row.wifiPassword?.trim() || null,
    description: row.description?.trim() || null,
    isVerified: row.isVerified ? row.isVerified.toLowerCase() === 'true' : true,
    moderationStatus: (row.moderationStatus as 'pending' | 'approved' | 'rejected') || 'approved',
    submittedBy: row.submittedBy?.trim() || null,
  };
}

export async function importHotspotsFromCSV(filePath: string): Promise<InsertHotspot[]> {
  return new Promise((resolve, reject) => {
    const hotspots: InsertHotspot[] = [];
    const errors: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CSVHotspot) => {
        try {
          const hotspot = parseHotspotFromCSV(row);
          
          // Basic validation
          if (!hotspot.name || !hotspot.address || !hotspot.latitude || !hotspot.longitude) {
            errors.push(`Invalid row: ${JSON.stringify(row)}`);
            return;
          }

          if (isNaN(hotspot.latitude) || isNaN(hotspot.longitude)) {
            errors.push(`Invalid coordinates for: ${hotspot.name}`);
            return;
          }

          hotspots.push(hotspot);
        } catch (error) {
          errors.push(`Error parsing row: ${JSON.stringify(row)} - ${error}`);
        }
      })
      .on('end', () => {
        if (errors.length > 0) {
          console.warn('CSV import warnings:', errors);
        }
        console.log(`Successfully parsed ${hotspots.length} hotspots from CSV`);
        resolve(hotspots);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function loadInitialData(): Promise<InsertHotspot[]> {
  const csvPath = path.join(process.cwd(), 'server', 'data', 'hotspots.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('No CSV file found at:', csvPath);
    return [];
  }

  try {
    const hotspots = await importHotspotsFromCSV(csvPath);
    console.log(`Loaded ${hotspots.length} hotspots from CSV`);
    return hotspots;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
}