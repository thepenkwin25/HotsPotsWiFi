import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-final";
import { insertHotspotSchema, insertReviewSchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve vanilla HTML directly without React processing
  app.get("/vanilla", (req, res) => {
    const vanillaPath = path.resolve(import.meta.dirname, "..", "client", "index-vanilla.html");
    res.sendFile(vanillaPath);
  });

  // Get Supabase configuration for frontend
  app.get("/api/config", (req, res) => {
    const supabaseUrl = process.env.DATABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    res.json({
      supabaseUrl,
      supabaseAnonKey
    });
  });

  // Get all hotspots
  app.get("/api/hotspots", async (req, res) => {
    try {
      const hotspots = await storage.getAllHotspots();
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotspots" });
    }
  });

  // Get hotspot by ID
  app.get("/api/hotspots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hotspot ID" });
      }

      const hotspot = await storage.getHotspotById(id);
      if (!hotspot) {
        return res.status(404).json({ message: "Hotspot not found" });
      }

      res.json(hotspot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotspot" });
    }
  });

  // Search hotspots
  app.get("/api/hotspots/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const hotspots = await storage.searchHotspots(query);
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ message: "Failed to search hotspots" });
    }
  });

  // Get hotspots near location
  app.get("/api/hotspots/near/:lat/:lng", async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const hotspots = await storage.getHotspotsNearLocation(lat, lng, radius);
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nearby hotspots" });
    }
  });

  // Create new hotspot
  app.post("/api/hotspots", async (req, res) => {
    try {
      const validatedData = insertHotspotSchema.parse(req.body);
      const hotspot = await storage.createHotspot(validatedData);
      res.status(201).json(hotspot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create hotspot" });
    }
  });

  // Admin moderation endpoints
  app.get("/api/admin/hotspots/pending", async (req, res) => {
    try {
      const pendingHotspots = await storage.getPendingHotspots();
      res.json(pendingHotspots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending hotspots" });
    }
  });

  app.get("/api/admin/hotspots/all", async (req, res) => {
    try {
      const allHotspots = await storage.getAllHotspots();
      const pendingHotspots = await storage.getPendingHotspots();
      res.json([...allHotspots, ...pendingHotspots]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all hotspots" });
    }
  });

  app.post("/api/admin/hotspots/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hotspot ID" });
      }
      await storage.approveHotspot(id);
      res.json({ success: true, message: "Hotspot approved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve hotspot" });
    }
  });

  app.post("/api/admin/hotspots/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hotspot ID" });
      }
      await storage.rejectHotspot(id);
      res.json({ success: true, message: "Hotspot rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject hotspot" });
    }
  });

  // Reviews API endpoints
  app.get("/api/hotspots/:id/reviews", async (req, res) => {
    try {
      const hotspotId = parseInt(req.params.id);
      if (isNaN(hotspotId)) {
        return res.status(400).json({ message: "Invalid hotspot ID" });
      }
      const reviews = await storage.getReviewsForHotspot(hotspotId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      await storage.updateHotspotRating(reviewData.hotspotId);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Photos API endpoints
  app.get("/api/hotspots/:id/photos", async (req, res) => {
    try {
      const hotspotId = parseInt(req.params.id);
      if (isNaN(hotspotId)) {
        return res.status(400).json({ message: "Invalid hotspot ID" });
      }
      const photos = await storage.getPhotosForHotspot(hotspotId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Favorites API endpoints
  app.get("/api/favorites/check", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const hotspotId = parseInt(req.query.hotspotId as string);
      if (isNaN(userId) || isNaN(hotspotId)) {
        return res.status(400).json({ message: "Invalid user or hotspot ID" });
      }
      const isFavorite = await storage.isFavorite(userId, hotspotId);
      res.json(isFavorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse(req.body);
      await storage.addFavorite(favoriteData);
      res.status(201).json({ success: true, message: "Added to favorites" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    try {
      const { userId, hotspotId } = req.body;
      if (!userId || !hotspotId) {
        return res.status(400).json({ message: "User ID and hotspot ID required" });
      }
      await storage.removeFavorite(parseInt(userId), parseInt(hotspotId));
      res.json({ success: true, message: "Removed from favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/users/:id/favorites", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user favorites" });
    }
  });

  // Hotspot detail page route
  app.get("/hotspot/:id", (req, res) => {
    const detailPath = path.resolve(import.meta.dirname, "..", "client", "hotspot-detail.html");
    res.sendFile(detailPath);
  });

  // Simple test page first
  app.get("/test", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
<h1>Test Page Works!</h1>
<p>If you can see this, the server is working correctly.</p>
<script>
fetch('/api/hotspots')
  .then(r => r.json())
  .then(data => {
    document.body.innerHTML += '<p>Loaded ' + data.length + ' hotspots from API</p>';
  });
</script>
</body>
</html>`);
  });

  // Serve working version as main page 
  app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HotsPots - WiFi Finder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2d4ca3;
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.5rem;
      font-weight: 800;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
    .search-container {
      margin-bottom: 30px;
    }
    .search-box {
      width: 100%;
      padding: 15px 20px;
      border: 2px solid #e0e0e0;
      border-radius: 15px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.3s;
    }
    .search-box:focus {
      border-color: #2d4ca3;
    }
    .ad-banner {
      width: 100%;
      height: 90px;
      background: linear-gradient(45deg, #f8fafc, #e2e8f0);
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 25px;
      color: #64748b;
      font-weight: 600;
    }
    .hotspot-grid {
      display: grid;
      gap: 20px;
    }
    .hotspot-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .hotspot-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      border-color: #2d4ca3;
    }
    .hotspot-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .verified-badge {
      background: #10b981;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .sponsored-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(45deg, #fbbf24, #f59e0b);
      color: #92400e;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .rating-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .stars {
      color: #fbbf24;
      font-size: 1.1rem;
      letter-spacing: 1px;
    }
    .rating-text {
      color: #6b7280;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .address {
      color: #6b7280;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }
    .category {
      background: linear-gradient(45deg, #e6f1fe, #dbeafe);
      color: #3572d6;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-block;
      margin-right: 10px;
    }
    .wifi-badge {
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-block;
    }
    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
      font-size: 1.1rem;
    }
    .error {
      text-align: center;
      padding: 40px 20px;
      color: #ef4444;
      background: #fef2f2;
      border-radius: 12px;
      border: 1px solid #fecaca;
    }
    .stats {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
      border-radius: 12px;
      color: #0369a1;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .container { padding: 20px; margin: 10px; }
      h1 { font-size: 2rem; }
      .hotspot-card { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="ad-banner">
      📢 Premium WiFi Locations - Sponsored Content
    </div>
    
    <h1>HotsPots</h1>
    <div class="subtitle">Discover verified WiFi hotspots across New England</div>
    
    <div class="search-container">
      <input type="text" class="search-box" id="searchInput" placeholder="Search by name, location, or category...">
    </div>
    
    <div id="stats" class="stats" style="display: none;"></div>
    
    <div id="hotspotGrid" class="hotspot-grid">
      <div class="loading">Loading WiFi hotspots...</div>
    </div>
  </div>

  <script>
    let allHotspots = [];
    let isLoading = true;
    
    async function loadHotspots() {
      try {
        const response = await fetch('/api/hotspots');
        if (!response.ok) throw new Error('Failed to fetch');
        
        allHotspots = await response.json();
        displayHotspots(allHotspots);
        updateStats(allHotspots.length);
        isLoading = false;
      } catch (error) {
        console.error('Error loading hotspots:', error);
        document.getElementById('hotspotGrid').innerHTML = 
          '<div class="error">Unable to load WiFi hotspots. Please refresh the page.</div>';
      }
    }
    
    function updateStats(count) {
      const statsEl = document.getElementById('stats');
      statsEl.textContent = count + ' verified WiFi locations available';
      statsEl.style.display = 'block';
    }
    
    function displayHotspots(hotspots) {
      const container = document.getElementById('hotspotGrid');
      
      if (hotspots.length === 0) {
        container.innerHTML = '<div class="error">No hotspots found matching your search.</div>';
        return;
      }
      
      container.innerHTML = '';
      
      hotspots.forEach(function(hotspot) {
        const card = document.createElement('div');
        card.className = 'hotspot-card';
        card.onclick = function() { 
          window.location.href = '/hotspot/' + hotspot.id; 
        };
        
        let starsHtml = '';
        if (hotspot.averageRating > 0) {
          for (let i = 1; i <= 5; i++) {
            starsHtml += i <= hotspot.averageRating ? '★' : '☆';
          }
        }
        
        let html = '';
        if (hotspot.isSponsored) {
          html += '<div class="sponsored-badge">Featured</div>';
        }
        
        html += '<div class="hotspot-name">' + escapeHtml(hotspot.name);
        if (hotspot.isVerified) {
          html += '<span class="verified-badge">✓ Verified</span>';
        }
        html += '</div>';
        
        if (hotspot.averageRating > 0) {
          html += '<div class="rating-section">';
          html += '<span class="stars">' + starsHtml + '</span>';
          html += '<span class="rating-text">' + hotspot.averageRating.toFixed(1) + ' (' + hotspot.reviewCount + ' reviews)</span>';
          html += '</div>';
        }
        
        html += '<div class="address">' + escapeHtml(hotspot.address) + '</div>';
        html += '<div style="margin-top: 12px;">';
        html += '<span class="category">' + escapeHtml(hotspot.category) + '</span>';
        if (hotspot.isFree) {
          html += '<span class="wifi-badge">Free WiFi</span>';
        }
        html += '</div>';
        
        card.innerHTML = html;
        container.appendChild(card);
      });
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    document.getElementById('searchInput').addEventListener('input', function(e) {
      if (isLoading) return;
      
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        displayHotspots(allHotspots);
        updateStats(allHotspots.length);
        return;
      }
      
      const filtered = allHotspots.filter(function(hotspot) {
        return hotspot.name.toLowerCase().indexOf(query) !== -1 ||
               hotspot.address.toLowerCase().indexOf(query) !== -1 ||
               hotspot.category.toLowerCase().indexOf(query) !== -1;
      });
      
      displayHotspots(filtered);
      updateStats(filtered.length);
    });
    
    document.addEventListener('DOMContentLoaded', loadHotspots);
  </script>
</body>
</html>`);
  });

  // Alternative vanilla version
  app.get("/full", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "../client/index-vanilla.html"));
  });

  // Keep vanilla route as backup
  app.get("/vanilla", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "../client/index-vanilla.html"));
  });

  const httpServer = createServer(app);
  return httpServer;
}
