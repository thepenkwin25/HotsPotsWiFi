# HotsPots WiFi Finder

A Progressive Web App that helps users discover and share public WiFi hotspots with an interactive map of verified locations across New England.

## Features

- 70+ verified WiFi hotspots across New England
- Real-time search functionality
- Verification badges for trusted locations
- Categories: Cafes, Libraries, Restaurants, Coworking Spaces
- Location-based discovery
- Responsive design

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/HotsPotsWiFi.git
cd HotsPotsWiFi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add your database URL:
```
DATABASE_URL=your_postgresql_connection_string
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## API Endpoints

- `GET /` - Main application interface
- `GET /api/hotspots` - List all hotspots
- `GET /api/hotspots/search?q=query` - Search hotspots
- `POST /api/hotspots` - Add new hotspot (authenticated)

## Database Schema

The application uses the following main tables:
- `hotspots` - WiFi location data
- `users` - User accounts
- `reviews` - User reviews and ratings
- `photos` - Hotspot photos
- `favorites` - User favorite hotspots

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_ANON_KEY` - Supabase public key (optional)

## Data Sources

Hotspot data sourced from verified New England business directories and public WiFi databases, covering:
- Massachusetts
- New Hampshire 
- Vermont
- Maine
- Rhode Island
- Connecticut

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details