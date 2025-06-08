import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { storage } from "./storage-final";
import { log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Supabase database
  try {
    const { initializeDatabase } = await import("./supabase");
    await initializeDatabase();
    console.log("Supabase database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
  }

  // Serve static files
  app.use(express.static('server/public'));

  // API routes
  app.get("/api/hotspots", async (req, res) => {
    try {
      const hotspots = await storage.getAllHotspots();
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotspots" });
    }
  });

  // Simple test route
  app.get("/simple", (req, res) => {
    res.send("<h1>Server Working!</h1><p>If you see this, the server is responding correctly.</p>");
  });

  // Minimal HTML test
  app.get("/minimal", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><title>Minimal Test</title></head>
<body>
  <h1>Minimal HTML Test</h1>
  <p>This is a basic HTML page to test rendering.</p>
  <div id="content">Loading...</div>
  <script>
    document.getElementById('content').innerHTML = 'JavaScript is working!';
  </script>
</body>
</html>`);
  });

  // Progressive test
  app.get("/progressive", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><title>Progressive Test</title></head>
<body>
  <h1>Progressive Loading Test</h1>
  <div id="step1">Step 1: HTML loaded</div>
  <div id="step2">Step 2: Waiting...</div>
  <div id="step3">Step 3: Waiting...</div>
  
  <script>
    console.log('Script started');
    document.getElementById('step2').innerHTML = 'Step 2: JavaScript working';
    
    fetch('/api/hotspots')
      .then(response => {
        console.log('API response:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Data loaded:', data.length);
        document.getElementById('step3').innerHTML = 'Step 3: API loaded ' + data.length + ' hotspots';
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById('step3').innerHTML = 'Step 3: API error - ' + error.message;
      });
  </script>
</body>
</html>`);
  });

  // Main application route
  app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>HotsPots Working</title></head><body><h1>HotsPots WiFi Finder</h1><p>Server is running correctly.</p><p><a href="/api/hotspots">View JSON API</a></p></body></html>`);
  });

  // Old client-side version kept as backup
  app.get("/client", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>HotsPots - WiFi Finder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: Arial, sans-serif;
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
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .search-box {
      width: 100%;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 15px;
      font-size: 1rem;
      margin-bottom: 20px;
      box-sizing: border-box;
    }
    .ad-banner {
      width: 100%;
      height: 90px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 25px;
      color: #6c757d;
      font-weight: bold;
    }
    .stats {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #e3f2fd;
      border-radius: 12px;
      color: #1976d2;
      font-weight: bold;
    }
    .hotspot-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .hotspot-card:hover {
      box-shadow: 0 8px 12px rgba(0,0,0,0.1);
      border-color: #2d4ca3;
    }
    .hotspot-name {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .verified-badge {
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-left: 8px;
    }
    .address {
      color: #6b7280;
      margin-bottom: 8px;
    }
    .category {
      background: #dbeafe;
      color: #1e40af;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      display: inline-block;
      margin-right: 10px;
    }
    .wifi-badge {
      background: #10b981;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="ad-banner">🏢 Premium WiFi Locations - Sponsored Content</div>
    
    <h1>HotsPots</h1>
    <div class="subtitle">Discover verified WiFi hotspots across New England</div>
    
    <input type="text" class="search-box" id="searchInput" placeholder="Search by name, location, or category...">
    
    <div id="stats" class="stats" style="display: none;"></div>
    
    <div id="hotspotGrid">
      <div class="loading">Loading WiFi hotspots...</div>
    </div>
  </div>

  <script>
    console.log('HotsPots WiFi finder starting...');
    var allHotspots = [];
    
    function escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function updateStats(count) {
      var el = document.getElementById('stats');
      if (el) {
        el.textContent = count + ' verified WiFi locations available';
        el.style.display = 'block';
      }
    }
    
    function displayHotspots(hotspots) {
      console.log('Displaying', hotspots.length, 'hotspots');
      var container = document.getElementById('hotspotGrid');
      if (!container) return;
      
      if (hotspots.length === 0) {
        container.innerHTML = '<div class="error">No hotspots found matching your search.</div>';
        return;
      }
      
      container.innerHTML = '';
      
      for (var i = 0; i < Math.min(hotspots.length, 50); i++) {
        var hotspot = hotspots[i];
        var card = document.createElement('div');
        card.className = 'hotspot-card';
        
        var nameHtml = '<div class="hotspot-name">' + escapeHtml(hotspot.name);
        if (hotspot.isVerified) {
          nameHtml += '<span class="verified-badge">✓ Verified</span>';
        }
        nameHtml += '</div>';
        
        var addressHtml = '<div class="address">' + escapeHtml(hotspot.address) + '</div>';
        
        var badgesHtml = '<div style="margin-top: 12px;">';
        badgesHtml += '<span class="category">' + escapeHtml(hotspot.category) + '</span>';
        if (hotspot.isFree) {
          badgesHtml += '<span class="wifi-badge">Free WiFi</span>';
        }
        badgesHtml += '</div>';
        
        card.innerHTML = nameHtml + addressHtml + badgesHtml;
        
        // Add click handler with closure
        (function(h) {
          card.onclick = function() {
            alert('Hotspot Details:\\n\\n' + 
                  'Name: ' + h.name + '\\n' +
                  'Address: ' + h.address + '\\n' +
                  'Category: ' + h.category + '\\n' +
                  'Free WiFi: ' + (h.isFree ? 'Yes' : 'No') + '\\n' +
                  'Verified: ' + (h.isVerified ? 'Yes' : 'No'));
          };
        })(hotspot);
        
        container.appendChild(card);
      }
      
      if (hotspots.length > 50) {
        var moreDiv = document.createElement('div');
        moreDiv.innerHTML = '<div class="stats">Showing first 50 of ' + hotspots.length + ' results</div>';
        container.appendChild(moreDiv);
      }
    }
    
    function loadHotspots() {
      console.log('Loading hotspots from API...');
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/hotspots', true);
      xhr.timeout = 10000;
      
      xhr.onload = function() {
        console.log('API response received, status:', xhr.status);
        if (xhr.status === 200) {
          try {
            allHotspots = JSON.parse(xhr.responseText);
            console.log('Successfully loaded', allHotspots.length, 'hotspots');
            displayHotspots(allHotspots);
            updateStats(allHotspots.length);
          } catch (e) {
            console.error('JSON parse error:', e);
            document.getElementById('hotspotGrid').innerHTML = 
              '<div class="error">Error parsing hotspot data.</div>';
          }
        } else {
          console.error('HTTP error:', xhr.status);
          document.getElementById('hotspotGrid').innerHTML = 
            '<div class="error">Unable to load WiFi hotspots (Error ' + xhr.status + '). Please refresh.</div>';
        }
      };
      
      xhr.onerror = function() {
        console.error('Network error occurred');
        document.getElementById('hotspotGrid').innerHTML = 
          '<div class="error">Network error. Please check connection and refresh.</div>';
      };
      
      xhr.ontimeout = function() {
        console.error('Request timeout');
        document.getElementById('hotspotGrid').innerHTML = 
          '<div class="error">Request timeout. Please refresh the page.</div>';
      };
      
      xhr.send();
    }
    
    // Search functionality
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        if (!query) {
          displayHotspots(allHotspots);
          updateStats(allHotspots.length);
          return;
        }
        
        var filtered = [];
        for (var i = 0; i < allHotspots.length; i++) {
          var hotspot = allHotspots[i];
          if ((hotspot.name && hotspot.name.toLowerCase().indexOf(query) !== -1) ||
              (hotspot.address && hotspot.address.toLowerCase().indexOf(query) !== -1) ||
              (hotspot.category && hotspot.category.toLowerCase().indexOf(query) !== -1)) {
            filtered.push(hotspot);
          }
        }
        
        displayHotspots(filtered);
        updateStats(filtered.length);
      });
    }
    
    // Load hotspots when page is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadHotspots);
    } else {
      loadHotspots();
    }
  </script>
</body>
</html>`);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const server = createServer(app);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
