interface AnalyticsEvent {
  event: string;
  hotspotId?: number;
  location?: { latitude: number; longitude: number };
  timestamp: Date;
  sessionId: string;
}

class AnalyticsTracker {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredEvents() {
    try {
      const stored = localStorage.getItem('analytics-events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics events');
    }
  }

  private saveEvents() {
    try {
      localStorage.setItem('analytics-events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to save analytics events');
    }
  }

  track(event: string, data?: { hotspotId?: number; location?: { latitude: number; longitude: number } }) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      hotspotId: data?.hotspotId,
      location: data?.location,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // In production, send to analytics endpoint
    if (navigator.onLine) {
      this.syncEvents();
    }
  }

  private async syncEvents() {
    if (this.events.length === 0) return;

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.events }),
      });

      if (response.ok) {
        this.events = [];
        this.saveEvents();
      }
    } catch (error) {
      // Will retry on next sync
      console.warn('Analytics sync failed, will retry later');
    }
  }

  // Public methods for tracking key user actions
  trackHotspotView(hotspotId: number, location?: { latitude: number; longitude: number }) {
    this.track('hotspot_view', { hotspotId, location });
  }

  trackDirectionsRequest(hotspotId: number) {
    this.track('directions_request', { hotspotId });
  }

  trackHotspotShare(hotspotId: number) {
    this.track('hotspot_share', { hotspotId });
  }

  trackSearch(query: string, resultCount: number) {
    this.track('search', { location: { latitude: resultCount, longitude: query.length } });
  }

  trackLocationRequest() {
    this.track('location_request');
  }

  trackHotspotAdd(location: { latitude: number; longitude: number }) {
    this.track('hotspot_add', { location });
  }

  trackFavoriteToggle(hotspotId: number, isFavorited: boolean) {
    this.track(isFavorited ? 'favorite_add' : 'favorite_remove', { hotspotId });
  }
}

export const analytics = new AnalyticsTracker();