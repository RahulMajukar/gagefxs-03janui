import api from '../../api/axios';

const calendarAPI = {
  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  // Get user email for API headers
  getUserEmail: () => {
    try {
      // Try top-level email key first
      const emailFromKey = localStorage.getItem('email');
      if (emailFromKey) return emailFromKey;

      // Fallback to user object
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.email || user?.username || user?.userEmail || '';
    } catch (error) {
      console.warn('Could not get user email:', error);
      return '';
    }
  },

  // Get auth headers with User-Email
  getAuthHeaders: () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const userEmail = calendarAPI.getUserEmail();
    if (userEmail) {
      headers['User-Email'] = userEmail;
    } else {
      console.warn('⚠️ No user email available for API requests');
    }
    
    return headers;
  },

  // ==========================================
  // EVENT CRUD OPERATIONS
  // ==========================================

  /**
   * Get all user events (owned + attending)
   */
  getUserEvents: async () => {
    try {
      const res = await api.get('/calendar/events', {
        headers: calendarAPI.getAuthHeaders()
      });
      console.log('✅ Fetched user events:', res.data.length);
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching user events:', error);
      throw error;
    }
  },

  /**
   * Get events created by user
   */
  getEventsCreatedByUser: async () => {
    try {
      const res = await api.get('/calendar/events/owned', {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching owned events:', error);
      throw error;
    }
  },

  /**
   * Get events user is attending
   */
  getEventsUserAttending: async () => {
    try {
      const res = await api.get('/calendar/events/attending', {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching attending events:', error);
      throw error;
    }
  },

  /**
   * Get single event by ID
   */
  getEventById: async (id) => {
    try {
      const res = await api.get(`/calendar/events/${id}`, {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return {
        ...res.data,
        id: res.data.id || res.data._id,
        start: new Date(res.data.start),
        end: new Date(res.data.end),
      };
    } catch (error) {
      console.error('❌ Error fetching event:', error);
      throw error;
    }
  },

  /**
   * Create new event
   */
  createEvent: async (eventData) => {
    try {
      const user = calendarAPI.getCurrentUser();
      
      const payload = {
        ...eventData,
        username: user?.email || user?.username,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        category: eventData.category || 'work',
        priority: eventData.priority || 'medium',
        isAllDay: eventData.isAllDay || false,
        isRecurring: eventData.isRecurring || false,
      };

      console.log('📤 Creating event:', payload);
      
      const res = await api.post('/calendar/events', payload, {
        headers: calendarAPI.getAuthHeaders()
      });
      
      console.log('✅ Event created:', res.data);
      
      return {
        ...res.data,
        id: res.data.id || res.data._id,
        start: new Date(res.data.start),
        end: new Date(res.data.end),
      };
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  },

  /**
   * Update existing event
   */
  updateEvent: async (id, eventData) => {
    try {
      const user = calendarAPI.getCurrentUser();
      
      const payload = {
        ...eventData,
        username: user?.email || user?.username,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        category: eventData.category || 'work',
        priority: eventData.priority || 'medium',
        isAllDay: eventData.isAllDay || false,
        isRecurring: eventData.isRecurring || false,
      };

      console.log('✏️ Updating event:', id);
      
      const res = await api.put(`/calendar/events/${id}`, payload, {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return {
        ...res.data,
        id: res.data.id || res.data._id,
        start: new Date(res.data.start),
        end: new Date(res.data.end),
      };
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  /**
   * Delete event (including recurring events)
   */
  deleteEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('No event ID provided for deletion');
      }

      // Clean the ID
      const cleanId = id.toString().split(':')[0];
      console.log('🗑️ Deleting event:', cleanId);
      
      const headers = calendarAPI.getAuthHeaders();
      
      const response = await api.delete(`/calendar/events/${cleanId}`, { 
        headers 
      });
      
      console.log('✅ Event deleted successfully');
      return response.data;
      
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      
      let errorMessage = 'Failed to delete event';
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this event';
      } else if (error.response?.status === 404) {
        errorMessage = 'Event not found';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ==========================================
  // ACCEPT/DECLINE FUNCTIONALITY
  // ==========================================

  /**
   * Accept or decline event invitation
   */
  respondToEvent: async (eventId, action) => {
    try {
      if (!eventId) {
        throw new Error('No event ID provided');
      }
      if (!['accept', 'decline'].includes(action)) {
        throw new Error('Action must be "accept" or "decline"');
      }

      console.log(`📬 Responding to event ${eventId}: ${action}`);
      
      const res = await api.post(
        `/calendar/events/${eventId}/respond`,
        { action },
        { headers: calendarAPI.getAuthHeaders() }
      );
      
      console.log('✅ Response recorded:', res.data);
      
      return {
        ...res.data.event,
        id: res.data.event.id || res.data.event._id,
        start: new Date(res.data.event.start),
        end: new Date(res.data.event.end),
      };
    } catch (error) {
      console.error('❌ Error responding to event:', error);
      
      let errorMessage = 'Failed to respond to event';
      
      if (error.response?.status === 403) {
        errorMessage = 'You are not invited to this event';
      } else if (error.response?.status === 404) {
        errorMessage = 'Event not found';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ==========================================
  // SEARCH & FILTER
  // ==========================================

  /**
   * Search user events
   */
  searchUserEvents: async (query) => {
    try {
      const res = await api.get(`/calendar/events/search?q=${encodeURIComponent(query)}`, {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error searching events:', error);
      throw error;
    }
  },

  /**
   * Get events by category
   */
  getUserEventsByCategory: async (category) => {
    try {
      const res = await api.get(`/calendar/events/category/${category}`, {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching events by category:', error);
      throw error;
    }
  },

  /**
   * Get upcoming events
   */
  getUpcomingEvents: async () => {
    try {
      const res = await api.get('/calendar/events/upcoming', {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching upcoming events:', error);
      throw error;
    }
  },
/**
 * Test API connection
 */
testConnection: async () => {
  try {
    const res = await api.get('/calendar/health', {
      headers: calendarAPI.getAuthHeaders(),
    });
    console.log('✅ Calendar API connection OK:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Calendar API connection failed:', error);
    throw error;
  }
},

  /**
   * Get today's events
   */
  getTodayEvents: async () => {
    try {
      const res = await api.get('/calendar/events/today', {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching today\'s events:', error);
      throw error;
    }
  },

  /**
   * Get expired events
   */
  getExpiredEvents: async () => {
    try {
      const res = await api.get('/calendar/events/expired', {
        headers: calendarAPI.getAuthHeaders()
      });
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching expired events:', error);
      throw error;
    }
  },

  /**
   * Get events by date range
   */
  getEventsByDateRange: async (startDate, endDate) => {
    try {
      const res = await api.get(
        `/calendar/events/date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: calendarAPI.getAuthHeaders() }
      );
      
      return res.data.map(event => ({
        ...event,
        id: event.id || event._id,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('❌ Error fetching events by date range:', error);
      throw error;
    }
  },

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get user event statistics
   */
  getUserEventStats: async () => {
    try {
      const res = await api.get('/calendar/events/user/stats', {
        headers: calendarAPI.getAuthHeaders()
      });
      return res.data;
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      throw error;
    }
  },

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Set user email explicitly
   */
  setUserEmail: (email) => {
    if (email) {
      try {
        localStorage.setItem('email', email);
        const user = JSON.parse(localStorage.getItem('user')) || {};
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User email set:', email);
      } catch (error) {
        console.error('Error setting user email:', error);
      }
    }
  },

  /**
   * Debug user state
   */
  debugUserState: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const email = calendarAPI.getUserEmail();
      console.log('🔍 User debug info:', {
        userFromStorage: user,
        extractedEmail: email,
        headers: calendarAPI.getAuthHeaders()
      });
      return { user, email };
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  },
};

export default calendarAPI;