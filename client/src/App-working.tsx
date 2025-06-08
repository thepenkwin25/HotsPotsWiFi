import { useState, useEffect } from "react";

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

function App() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hotspots')
      .then(res => res.json())
      .then(data => {
        setHotspots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load hotspots:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>HotsPots WiFi Finder</h1>
        <p>Loading hotspots...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#2563eb", marginBottom: "20px" }}>HotsPots WiFi Finder</h1>
      <p style={{ marginBottom: "30px", color: "#6b7280" }}>
        Find free WiFi hotspots near you. {hotspots.length} locations available.
      </p>
      
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {hotspots.slice(0, 12).map(hotspot => (
          <div key={hotspot.id} style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <h3 style={{ margin: 0, color: "#1f2937" }}>{hotspot.name}</h3>
              {hotspot.isVerified && (
                <span style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  Verified
                </span>
              )}
            </div>
            <p style={{ margin: "8px 0", color: "#6b7280", fontSize: "14px" }}>{hotspot.address}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px"
              }}>
                {hotspot.category}
              </span>
              <span style={{ color: hotspot.isFree ? "#059669" : "#dc2626", fontSize: "14px", fontWeight: "bold" }}>
                {hotspot.isFree ? "Free WiFi" : "Paid WiFi"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
        <h2 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>Admin Panel</h2>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Visit <a href="/admin" style={{ color: "#2563eb" }}>/admin</a> to manage hotspot submissions and moderation.
        </p>
      </div>
    </div>
  );
}

export default App;