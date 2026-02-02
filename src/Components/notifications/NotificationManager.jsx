// src/components/notifications/NotificationManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, RefreshCw, AlertCircle, Volume2, VolumeX, Calendar as CalendarIcon } from 'lucide-react';
import EventList from '../calendar/EventList'; // your EventList component
import calendarAPI from '../../Components/calendar/calendarApi';
import EventModal from '../../Components/calendar/EventModal'; // ← import your detailed modal

// Optional chime sound
const NOTIFICATION_SOUND = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-soft-bell-1-171.mp3');

const NotificationManager = ({ onClose }) => {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);      // ← for modal
  const [showEventModal, setShowEventModal] = useState(false);   // ← modal visibility
  const prevEventCountRef = useRef(0);

  const loadEvents = async (isRefresh = false) => {
    try {
      setError(null);
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);

      const fetched = await calendarAPI.getUserEvents();

      const now = new Date();
      let filtered = [...fetched];

      if (activeFilter === 'upcoming') {
        filtered = fetched.filter(e => new Date(e.start) > now);
      } else if (activeFilter === 'today') {
        const start = new Date(now); start.setHours(0,0,0,0);
        const end   = new Date(now); end.setHours(23,59,59,999);
        filtered = fetched.filter(e => {
          const s = new Date(e.start);
          return s >= start && s <= end;
        });
      } else if (activeFilter === 'past') {
        filtered = fetched.filter(e => new Date(e.end) < now);
      }

      filtered.sort((a, b) => new Date(b.start) - new Date(a.start));

      // Sound on new events
      const newCount = filtered.length;
      if (soundEnabled && newCount > prevEventCountRef.current && prevEventCountRef.current > 0) {
        NOTIFICATION_SOUND.currentTime = 0;
        NOTIFICATION_SOUND.play().catch(() => {});
      }
      prevEventCountRef.current = newCount;

      setEvents(filtered);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Could not load events');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeFilter]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => loadEvents(true), 90000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const upcomingCount = events.filter(e => new Date(e.start) > new Date()).length;

  const handleEventClick = (event) => {
    console.log('Event clicked in NotificationManager:', event.id, event.title);

    const eventId = event.id || event.originalEventId;
    if (!eventId) {
      console.warn('Event missing ID:', event);
      alert('Cannot open this event – missing ID');
      return;
    }

    // Open the same detailed modal
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-xl overflow-hidden border border-gray-200">

      {/* Header */}
      <div className="shrink-0 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-blue-600" />
              {upcomingCount > 0 && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[18px] flex items-center justify-center">
                  {upcomingCount}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Events</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5 text-gray-600" /> : <VolumeX className="h-5 w-5 text-gray-400" />}
            </button>

            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <RefreshCw className={`h-5 w-5 ${autoRefreshEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'upcoming', 'today', 'past'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 shadow-sm ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
              }`}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button
              onClick={() => loadEvents()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-blue-50 p-6 rounded-full mb-6 shadow-inner">
              <CalendarIcon className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              No {activeFilter === 'all' ? 'events' : activeFilter + ' events'}
            </h3>
            <p className="text-gray-600 max-w-md">
              {activeFilter === 'all' ? 'Create or join events to see them here.' : 'Try changing the filter.'}
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-2 py-4">
            <EventList
              events={events}
              onEventClick={handleEventClick} // ← opens detailed modal
              currentDate={new Date()}
              detailed={true}
            />
          </div>
        )}

        {/* The detailed event modal – shown only when clicking in this drawer */}
        {showEventModal && selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
            onEdit={() => {
              // Optional: implement edit flow if needed
              alert('Edit functionality can be added here');
            }}
            onDelete={(id) => {
              // Optional: call delete API if you want
              if (window.confirm('Delete this event?')) {
                // call calendarAPI.deleteEvent(id)
                setShowEventModal(false);
                setSelectedEvent(null);
                loadEvents(true);
              }
            }}
            onAccept={() => {
              // Optional: implement accept
              alert('Accept functionality can be added');
            }}
            onDecline={() => {
              // Optional: implement decline
              alert('Decline functionality can be added');
            }}
            onRefresh={() => loadEvents(true)}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationManager;