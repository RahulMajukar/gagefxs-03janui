// src/pages/NotificationsPage.jsx
// Renamed concept: EventHistoryPage – full list with filters & export

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Download, RefreshCw, AlertCircle } from 'lucide-react';
import calendarAPI from '../api/calendarAPI'; // adjust path if needed

const NotificationsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const allEvents = await calendarAPI.getUserEvents();

      const now = new Date();
      let filtered = allEvents;

      if (filter === 'upcoming') {
        filtered = allEvents.filter(e => new Date(e.start) > now);
      } else if (filter === 'past') {
        filtered = allEvents.filter(e => new Date(e.end) < now);
      }

      // Sort newest → oldest
      filtered.sort((a, b) => new Date(b.start) - new Date(a.start));

      setEvents(filtered);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Could not load event history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const exportToCSV = () => {
    const headers = [
      'Start', 'End', 'Title', 'Category', 'Priority',
      'All Day', 'Recurring', 'Description'
    ];

    const rows = events.map(e => [
      new Date(e.start).toISOString(),
      new Date(e.end).toISOString(),
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.category || '-',
      e.priority || '-',
      e.isAllDay ? 'Yes' : 'No',
      e.isRecurring ? 'Yes' : 'No',
      `"${(e.description || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event History</h1>
            <p className="text-gray-600">View all your owned and attending events</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={loading || events.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === 'upcoming' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === 'past' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No events found</h3>
          <p className="text-gray-500 mt-2">You don't have any events yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {events.map(event => (
            <div key={event.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <time className="text-sm font-medium text-gray-700">
                      {new Date(event.start).toLocaleString([], {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </time>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {event.category || 'event'}
                    </span>
                    {new Date(event.start) > new Date() && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {event.title || '(Untitled Event)'}
                  </h3>
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;