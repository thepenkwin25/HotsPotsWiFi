# HotsPots Autonomous Agent Roadmap (for VS Code AI Integration)

## 🧠 CONTEXT

You’re supporting development on a WiFi discovery web app called HotsPots. This app helps users find public WiFi networks with user-submitted verification. The stack includes:
- **Frontend**: React (Vite), TailwindCSS
- **Backend**: Supabase (auth, database, storage)
- **PWA features**: Location-based discovery, favorites, offline caching
- **Deployment**: Vercel (static front-end), Replit (code collab), and Supabase (hosted backend)

---

## 🛠️ PHASE 1 — CORE FUNCTIONALITY (Beta Launch)

### ✅ COMPLETED
- ✅ Google Auth with Supabase
- ✅ Supabase schema initialized (users, hotspots, favorites)
- ✅ PWA setup with service worker
- ✅ Custom branding / map display
- ✅ 70 New England WiFi entries loaded

---

## 🧭 CURRENT PRIORITIES

### 📍 1. ONBOARDING + USER FLOW
- On first login, prompt user to select or enter username
- Store username in profiles table (linked by auth.user.id)
- Allow profile picture uploads (store to Supabase Storage → avatars/)
- Implement basic account settings screen (username, avatar, email readonly)

**Relevant files:**
- ProfileSetup.jsx or AccountSettings.jsx
- Supabase helpers: supabaseClient.js

---

### 📍 2. HOTSPOT SUBMISSION + VERIFICATION
- Build “Add Hotspot” flow with:
  - Input fields: Name, Location (map select or autocomplete), Type (e.g., café, library), Notes
  - Hidden fields: submitted_by, timestamp
- Submit via Supabase into hotspots table with status = unverified
- Show “Unverified” badge until verified by admin
- Add ability for users to flag incorrect info

**Relevant files:**
- AddHotspotForm.jsx
- HotspotCard.jsx
- Map.jsx

---

### 📍 3. SEARCH + MAP EXPERIENCE (Yelp-style)
- Geolocation auto-center map to user location
- Dropdown filters (e.g., Verified Only, Type of Spot)
- Search bar with fuzzy search across hotspot names
- Custom icon markers: Verified = Green, Unverified = Gray

**Relevant files:**
- Map.jsx
- HotspotList.jsx
- SearchBar.jsx

---

### 📍 4. FAVORITES SYSTEM
- Enable user to “heart” a location
- Store in favorites table with user_id, hotspot_id
- Show “My Favorites” tab on profile or home

---

### 📍 5. ERROR HANDLING + FEEDBACK
- Add toasts or modals for:
  - Hotspot submission success/failure
  - Auth issues
  - Save/update confirmations
- Central error logging helper

---

## 💵 PHASE 2 — MONETIZATION + GROWTH (Not live yet, dev only)

### 🌍 1. AFFILIATE PROGRAM (Planned)
- Package affiliate system with:
  - WiFi extenders / routers
  - Verified listings perks for businesses
- Build affiliate submission interface
- Track clickthroughs and conversions (use affiliates + click_logs tables)

### 📦 2. BUSINESS OWNER DASHBOARD
- Business account sign-up
- Link to their hotspot(s)
- Upload promo offers
- Analytics: click count, saves, ratings

### 📲 3. ADS INTEGRATION
- Reserve space in hotspot detail screen for:
  - Google Ads (AdSense)
  - Internal banner ads (upload image + link)
- Build a system to rotate / manage ad slots

---

## 🔗 DATABASE STRUCTURE (REFERENCE)

```sql
-- Users handled by Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT,
  avatar_url TEXT
);

CREATE TABLE hotspots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  location GEOGRAPHY,
  type TEXT,
  notes TEXT,
  submitted_by UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  hotspot_id UUID REFERENCES hotspots(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE affiliates (
  id UUID PRIMARY KEY,
  name TEXT,
  url TEXT,
  hotspot_id UUID REFERENCES hotspots(id),
  commission_model TEXT
);
```

---

## 💬 HELPER FUNCTIONS YOU CAN AUTORUN

### 🔐 Get Logged-in User
```javascript
const { data: { user } } = await supabase.auth.getUser();
```

### 💾 Insert Hotspot
```javascript
const { data, error } = await supabase
  .from('hotspots')
  .insert([{
    name,
    location,
    type,
    notes,
    submitted_by: user.id
  }]);
```

### ❤️ Favorite a Hotspot
```javascript
await supabase.from('favorites').insert([
  { user_id: user.id, hotspot_id: selectedHotspotId }
]);
```

---

## 🧩 SUGGESTED COMPONENTS TO BUILD AUTONOMOUSLY
- AddHotspotForm.jsx
- HotspotCard.jsx (shows badges, map pin color, favorite button)
- Favorites.jsx (profile-based listing)
- BusinessSignUp.jsx (for future affiliate onboarding)
- AdSlot.jsx (rendered inside hotspot detail)

---

## ✅ AGENT INSTRUCTIONS

As the embedded AI assistant in VS Code, you are expected to:
1. Suggest implementation code when features are discussed.
2. Watch for missing component or prop logic and recommend fixes.
3. Autogenerate boilerplate components when missing.
4. Validate that Supabase functions are correctly used (with auth context).
5. Ensure semantic Tailwind styling with HotsPots brand color palette (deep blue, white, accent teal/orange).
6. Flag any deprecated React methods or compatibility mismatches.
7. Assist with deployment config when changes affect PWA/Vercel behavior.
