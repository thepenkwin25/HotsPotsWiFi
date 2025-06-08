import React from "react";
import { createRoot } from "react-dom/client";

interface Hotspot {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  isFree: boolean;
  isVerified: boolean;
}

function HotspotsApp() {
  const [hotspots, setHotspots] = React.useState<Hotspot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/hotspots')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setHotspots(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const containerStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    lineHeight: "1.6"
  };

  const headerStyle: React.CSSProperties = {
    color: "#1e40af",
    fontSize: "2.5rem",
    marginBottom: "10px",
    fontWeight: "bold"
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: "16px"
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "30px"
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <h1 style={headerStyle}>HotsPots WiFi Finder</h1>
        <div style={cardStyle}>
          <p>Loading WiFi hotspots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h1 style={headerStyle}>HotsPots WiFi Finder</h1>
        <div style={{...cardStyle, borderColor: "#dc2626", backgroundColor: "#fef2f2"}}>
          <p style={{color: "#dc2626"}}>Error loading hotspots: {error}</p>
          <p>Backend server is running on port 5000 with 20 hotspots loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>HotsPots WiFi Finder</h1>
      <p style={{fontSize: "1.1rem", color: "#6b7280", marginBottom: "20px"}}>
        Discover free WiFi hotspots near you. {hotspots.length} verified locations available.
      </p>

      {hotspots.length === 0 ? (
        <div style={cardStyle}>
          <p>No hotspots available. Backend server is running with data loaded.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {hotspots.slice(0, 12).map(hotspot => (
            <div key={hotspot.id} style={cardStyle}>
              <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px"}}>
                <h3 style={{margin: 0, color: "#1f2937", fontSize: "1.2rem"}}>{hotspot.name}</h3>
                {hotspot.isVerified && (
                  <span style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontWeight: "bold"
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              
              <p style={{margin: "8px 0", color: "#6b7280", fontSize: "0.9rem"}}>
                {hotspot.address}
              </p>
              
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px"}}>
                <span style={{
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: "500"
                }}>
                  {hotspot.category}
                </span>
                
                <span style={{
                  color: hotspot.isFree ? "#059669" : "#dc2626",
                  fontSize: "0.9rem",
                  fontWeight: "bold"
                }}>
                  {hotspot.isFree ? "Free WiFi" : "Paid Access"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        ...cardStyle,
        marginTop: "40px",
        backgroundColor: "#f8fafc",
        borderColor: "#cbd5e1"
      }}>
        <h2 style={{margin: "0 0 12px 0", color: "#1f2937"}}>Admin Panel</h2>
        <p style={{margin: 0, color: "#6b7280"}}>
          Access the <a href="/admin" style={{color: "#2563eb", textDecoration: "none"}}>admin panel</a> to manage hotspot submissions and moderation queue.
        </p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<HotspotsApp />);
}