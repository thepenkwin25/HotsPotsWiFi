import express from "express";
import { storage } from "./storage-final";

const app = express();
app.use(express.json());

// API routes
app.get("/api/hotspots", async (req, res) => {
  try {
    const hotspots = await storage.getAllHotspots();
    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch hotspots" });
  }
});

// Main page - complete standalone WiFi finder
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HotsPots - WiFi Finder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
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
    .search-box {
      width: 100%;
      padding: 15px 20px;
      border: 2px solid #e0e0e0;
      border-radius: 15px;
      font-size: 1rem;
      outline: none;
      margin-bottom: 20px;
    }
    .search-box:focus { border-color: #2d4ca3; }
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
    .stats {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
      border-radius: 12px;
      color: #0369a1;
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
    .loading, .error {
      text-align: center;
      padding: 60px 20px;
      font-size: 1.1rem;
    }
    .loading { color: #6b7280; }
    .error {
      color: #ef4444;
      background: #fef2f2;
      border-radius: 12px;
      border: 1px solid #fecaca;
      padding: 40px 20px;
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
    <div class="ad-banner">📢 Premium WiFi Locations - Sponsored Content</div>
    
    <h1>HotsPots</h1>
    <div class="subtitle">Discover verified WiFi hotspots across New England</div>
    
    <input type="text" class="search-box" id="searchInput" placeholder="Search by name, location, or category...">
    
    <div id="stats" class="stats" style="display: none;"></div>
    
    <div id="hotspotGrid" class="hotspot-grid">
      <div class="loading">Loading WiFi hotspots...</div>
    </div>
  </div>

  <script>
    let allHotspots = [];
    
    async function loadHotspots() {
      try {
        const response = await fetch('/api/hotspots');
        if (!response.ok) throw new Error('Network error');
        
        allHotspots = await response.json();
        displayHotspots(allHotspots);
        updateStats(allHotspots.length);
      } catch (error) {
        console.error('Load error:', error);
        document.getElementById('hotspotGrid').innerHTML = 
          '<div class="error">Unable to load WiFi hotspots. Please refresh the page.</div>';
      }
    }
    
    function updateStats(count) {
      const el = document.getElementById('stats');
      el.textContent = count + ' verified WiFi locations available';
      el.style.display = 'block';
    }
    
    function displayHotspots(hotspots) {
      const container = document.getElementById('hotspotGrid');
      
      if (hotspots.length === 0) {
        container.innerHTML = '<div class="error">No hotspots found matching your search.</div>';
        return;
      }
      
      container.innerHTML = '';
      
      hotspots.forEach(hotspot => {
        const card = document.createElement('div');
        card.className = 'hotspot-card';
        card.onclick = () => alert('Hotspot Details: ' + hotspot.name + '\\nAddress: ' + hotspot.address);
        
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
          let stars = '';
          for (let i = 1; i <= 5; i++) {
            stars += i <= hotspot.averageRating ? '★' : '☆';
          }
          html += '<div class="rating-section">';
          html += '<span class="stars">' + stars + '</span>';
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
    
    document.getElementById('searchInput').addEventListener('input', e => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        displayHotspots(allHotspots);
        updateStats(allHotspots.length);
        return;
      }
      
      const filtered = allHotspots.filter(hotspot => 
        hotspot.name.toLowerCase().includes(query) ||
        hotspot.address.toLowerCase().includes(query) ||
        hotspot.category.toLowerCase().includes(query)
      );
      
      displayHotspots(filtered);
      updateStats(filtered.length);
    });
    
    loadHotspots();
  </script>
</body>
</html>`);
});

// Initialize database and start server
(async () => {
  try {
    const { initializeDatabase } = await import("./supabase");
    await initializeDatabase();
    console.log("Database initialized");
  } catch (error) {
    console.error("Database init failed:", error);
  }

  const port = 3001;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Standalone server running on port ${port}`);
  });
})();