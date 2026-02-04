import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { useAuth } from '../../auth/AuthContext'
import Loader from "../Loader"
import { useCalendar } from '../../auth/CalendarContext'
import calendarAPI from './calendarAPI'
import EventModal from './EventModal'
// import EventForm from './EventForm'
import CalendarToolbar from './CalendarToolbar'
import EventList from './EventList'
import YearView from './YearView'
import CalendarSummaryCards from './CalendarSummaryCards'
import { expandAllRecurringEvents, getCalendarViewRange } from './expandRecurringEvent'
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  User,
  Crown,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarStyles.css'
import './CalendarCustomStyles.css'
import ExportCalendarButton from './ExportCalendarButton'
import PreviewEvents from './PreviewEvents'

const localizer = momentLocalizer(moment)

const views = ['month', 'week', 'day', 'agenda', 'year']

// Enhanced event style getter with acceptance status colors and past events
const eventStyleGetter = (event) => {
  const userRelationship = event.userRelationship || event.resource?.userRelationship || 'none'
  const acceptanceStatus = event.acceptanceStatus?.toUpperCase() || 'PENDING'
  const isPastEvent = moment(event.end).isBefore(moment())
  const eventCategory = event.category?.toLowerCase() || ''

  // Base colors by relationship - black text with colored borders
  const relationshipColors = {
    owner: {
      backgroundColor: 'white',
      borderColor: '#2563eb',
      color: '#000000'
    },
    attendee: {
      backgroundColor: 'white',
      borderColor: '#059669',
      color: '#000000'
    },
    none: {
      backgroundColor: 'white',
      borderColor: '#6b7280',
      color: '#000000'
    }
  }

  // Determine CSS class and style
  let className = ''
  let style = {}

  // Past events styling - gray border with white background and black text
  if (isPastEvent) {
    className = 'event-past'
    style = {
      backgroundColor: 'white',
      borderColor: '#9ca3af',
      color: '#000000',
      borderRadius: '6px',
      border: '2px solid #9ca3af',
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: '500',
      opacity: 0.7
    }
  }
  // ✅ INWARD events - GREEN styling (highest priority after past events)
  else if (eventCategory.includes('inward')) {
    className = 'event-inward'
    style = {
      backgroundColor: '#f0fdf4', // Light green background
      borderColor: '#16a34a', // Green border
      color: '#14532d', // Dark green text
      borderRadius: '6px',
      border: '2px solid #16a34a',
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: '500'
    }
  }
  // ✅ SCHEDULED events - ORANGE styling
  else if (eventCategory.includes('scheduled')) {
    className = 'event-scheduled'
    style = {
      backgroundColor: '#fffbeb', // Light orange background
      borderColor: '#f59e0b', // Orange border
      color: '#78350f', // Dark orange text
      borderRadius: '6px',
      border: '2px solid #f59e0b',
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: '500'
    }
  }
  // DECLINED events - RED border styling with black text
  else if (acceptanceStatus === 'DECLINED') {
    className = 'event-declined'
    style = {
      backgroundColor: 'white',
      borderColor: '#dc2626',
      color: '#000000',
      borderRadius: '6px',
      border: '2px solid #dc2626',
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: '600'
    }
  }
  // Override with acceptance status colors for attendees - black text with colored borders
  else if (userRelationship === 'attendee') {
    if (acceptanceStatus === 'ACCEPTED') {
      className = 'event-accepted'
      style = {
        backgroundColor: 'white',
        borderColor: '#10b981',
        color: '#000000',
        borderRadius: '6px',
        border: '2px solid #10b981',
        fontSize: '12px',
        padding: '2px 6px',
        fontWeight: '500'
      }
    } else if (acceptanceStatus === 'PENDING') {
      className = 'event-pending'
      style = {
        backgroundColor: 'white',
        borderColor: '#f59e0b',
        color: '#000000',
        borderRadius: '6px',
        border: '2px solid #f59e0b',
        fontSize: '12px',
        padding: '2px 6px',
        fontWeight: '500'
      }
    }
  }
  // Owner events
  else if (userRelationship === 'owner') {
    className = 'event-owner'
    style = {
      backgroundColor: 'white',
      borderColor: '#2563eb',
      color: '#000000',
      borderRadius: '6px',
      border: '2px solid #2563eb',
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: '600'
    }
  }
  // Default styling
  else {
    const colors = relationshipColors[userRelationship] || relationshipColors.none
    className = `event-${userRelationship}`
    style = {
      ...colors,
      borderRadius: '6px',
      border: `2px solid ${colors.borderColor}`,
      fontSize: '12px',
      padding: '2px 6px',
      fontWeight: userRelationship === 'owner' ? '600' : '500'
    }
  }

  return {
    className,
    style
  }
}

// Day Events Modal
const DayEventsModal = ({ isOpen, onClose, events, onEventClick, date }) => {
  if (!isOpen) return null;

  const isPastDate = moment(date).isBefore(moment(), 'day')
  const isToday = moment(date).isSame(moment(), 'day')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className={`px-6 py-4 text-white ${isPastDate ? 'bg-gradient-to-r from-red-400 to-red-400' :
            isToday ? 'bg-gradient-to-r red-400 to-red-400' :
              'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {isPastDate && '📅 Past Events - '}
              {isToday && '📅 Today - '}
              {!isPastDate && !isToday && '📅 Upcoming - '}
              {moment(date).format('dddd, MMMM DD, YYYY')}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found for this day.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => {
                const isPastEvent = moment(event.end).isBefore(moment())
                const isDeclined = event.acceptanceStatus?.toUpperCase() === 'DECLINED'
                const eventCategory = event.category?.toLowerCase() || ''

                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${isPastEvent
                        ? 'border-gray-300 bg-gray-50 hover:bg-gray-100 opacity-70'
                        : eventCategory.includes('inward')
                          ? 'border-green-400 bg-green-50 hover:bg-green-100'
                          : eventCategory.includes('scheduled')
                            ? 'border-orange-400 bg-orange-50 hover:bg-orange-100'
                            : isDeclined
                              ? 'border-red-400 bg-red-50 hover:bg-red-100'
                              : 'border-gray-200 bg-white hover:bg-blue-50 hover:shadow-md'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-semibold ${isPastEvent ? 'text-gray-600' :
                            eventCategory.includes('inward') ? 'text-green-800' :
                              eventCategory.includes('scheduled') ? 'text-orange-800' :
                                isDeclined ? 'text-red-800' :
                                  'text-gray-900'
                          }`}>
                          {isPastEvent && '✓ '}
                          {isDeclined && '✕ '}
                          {eventCategory.includes('inward') && '📥 '}
                          {eventCategory.includes('scheduled') && '📅 '}
                          {event.title}
                        </div>
                        <div className={`text-sm mt-1 flex items-center ${isPastEvent ? 'text-gray-500' :
                            eventCategory.includes('inward') ? 'text-green-600' :
                              eventCategory.includes('scheduled') ? 'text-orange-600' :
                                isDeclined ? 'text-red-600' :
                                  'text-gray-600'
                          }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {moment(event.start).format('h:mm A')} – {moment(event.end).format('h:mm A')}
                        </div>
                        {event.location && (
                          <div className={`text-sm flex items-center mt-1 ${isPastEvent ? 'text-gray-400' :
                              eventCategory.includes('inward') ? 'text-green-500' :
                                eventCategory.includes('scheduled') ? 'text-orange-500' :
                                  isDeclined ? 'text-red-500' :
                                    'text-gray-500'
                            }`}>
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.isRecurring && (
                          <div className={`text-sm flex items-center mt-1 ${isPastEvent ? 'text-gray-500' :
                              eventCategory.includes('inward') ? 'text-green-600' :
                                eventCategory.includes('scheduled') ? 'text-orange-600' :
                                  isDeclined ? 'text-red-600' :
                                    'text-purple-600'
                            }`}>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recurring event
                          </div>
                        )}
                        {event.category && (
                          <div className={`text-sm flex items-center mt-1 ${eventCategory.includes('inward')
                              ? 'bg-green-100 text-green-800 px-2 py-1 rounded inline-flex items-center'
                              : eventCategory.includes('scheduled')
                                ? 'bg-orange-100 text-orange-800 px-2 py-1 rounded inline-flex items-center'
                                : 'bg-gray-100 text-gray-800 px-2 py-1 rounded inline-flex items-center'
                            }`}>
                            <Tag className="h-3 w-3 mr-1" />
                            {event.category}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isPastEvent && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            Past
                          </span>
                        )}
                        {eventCategory.includes('inward') && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            📥 Inward
                          </span>
                        )}
                        {eventCategory.includes('scheduled') && (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            📅 Scheduled
                          </span>
                        )}
                        {event.userRelationship === 'owner' && (
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${isPastEvent ? 'bg-gray-200 text-gray-600' :
                              eventCategory.includes('inward') ? 'bg-green-200 text-green-800' :
                                eventCategory.includes('scheduled') ? 'bg-orange-200 text-orange-800' :
                                  isDeclined ? 'bg-red-200 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                            }`}>
                            <Crown className="h-3 w-3 mr-1" /> Owner
                          </span>
                        )}
                        {event.userRelationship === 'attendee' && !isPastEvent && !eventCategory.includes('inward') && !eventCategory.includes('scheduled') && (
                          <>
                            {event.acceptanceStatus?.toUpperCase() === 'ACCEPTED' && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                              </span>
                            )}
                            {event.acceptanceStatus?.toUpperCase() === 'DECLINED' && (
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                <XCircle className="h-3 w-3 mr-1" /> Declined
                              </span>
                            )}
                            {(!event.acceptanceStatus || event.acceptanceStatus?.toUpperCase() === 'PENDING') && (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                <Clock className="h-3 w-3 mr-1" /> Pending
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { user } = useAuth()
  const { sendEventCreated, sendEventUpdated, sendEventDeleted } = useCalendar()

  const [events, setEvents] = useState([])
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [showSidebar, setShowSidebar] = useState(true)
  const [calendarLayout, setCalendarLayout] = useState('calendar')
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [error, setError] = useState(null)
  const [userStats, setUserStats] = useState(null)

  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    eventType: true,
    category: true,
    legend: true,
    summary: true
  })

  const currentUser = user || calendarAPI.getCurrentUser()

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  // 🔥 CRITICAL FIX: Expand recurring events based on current view
  const expandedEvents = useMemo(() => {
    console.log('🔄 Expanding recurring events for view:', view);
    console.log('📅 Current date:', date);
    console.log('📊 Total events before expansion:', events.length);

    const viewRange = getCalendarViewRange(date, view);
    console.log('📆 View range:', viewRange);

    const expanded = expandAllRecurringEvents(events, viewRange.start, viewRange.end);
    console.log('✅ Total events after expansion:', expanded.length);

    return expanded;
  }, [events, date, view]);

  useEffect(() => {
    console.log('🔍 EVENTS LOADED:', events.map(event => ({
      id: event.id,
      hasId: !!event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      category: event.category,
      isRecurring: event.isRecurring,
      recurrence: event.recurrence,
      acceptanceStatus: event.acceptanceStatus
    })));
  }, [events])

  const testApiConnection = async () => {
    setConnectionStatus('checking')
    try {
      const result = await calendarAPI.testConnection()
      if (result.success) {
        setConnectionStatus('connected')
        setError(null)
      } else {
        setConnectionStatus('disconnected')
        setError(result.message)
      }
    } catch (error) {
      setConnectionStatus('disconnected')
      setError('Unable to connect to calendar service')
      console.error('API connection test failed:', error)
    }
  }

  useEffect(() => {
    testApiConnection()
  }, [])

  const loadEvents = useCallback(async (showRefreshIndicator = false) => {
    try {
      setError(null)
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      let eventsData = []

      switch (eventFilter) {
        case 'owned':
          eventsData = await calendarAPI.getEventsCreatedByUser()
          break
        case 'attending':
          eventsData = await calendarAPI.getEventsUserAttending()
          break
        default:
          eventsData = await calendarAPI.getUserEvents()
      }

      console.log('📥 Raw events data from API:', eventsData);

      const normalizedEvents = (Array.isArray(eventsData) ? eventsData : []).map(event => {
        let start = event.start ? new Date(event.start) : new Date();
        let end = event.end ? new Date(event.end) : new Date(Date.now() + 3600000);

        if (!event.id) {
          console.warn('⚠️ Event missing ID:', event);
        }

        return {
          ...event,
          start,
          end,
          category: event.category || '',
          acceptanceStatus: event.acceptanceStatus || 'pending',
          isRecurring: Boolean(event.isRecurring),
          recurrence: event.recurrence || null
        };
      }).filter(event =>
        !isNaN(event.start.getTime()) && !isNaN(event.end.getTime())
      );

      console.log('✅ Normalized events:', normalizedEvents);
      setEvents(normalizedEvents)
      setConnectionStatus('connected')

      const stats = await calendarAPI.getUserEventStats()
      setUserStats(stats)

    } catch (error) {
      console.error('Error loading events:', error)
      setError(error.message)
      setConnectionStatus('disconnected')
      toast.error(error.message || 'Failed to load events')
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [eventFilter])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const handleEventCreated = () => {
      console.log('WebSocket: Event created, refreshing calendar')
      loadEvents(true)
    }
    const handleEventUpdated = () => {
      console.log('WebSocket: Event updated, refreshing calendar')
      loadEvents(true)
    }
    const handleEventDeleted = () => {
      console.log('WebSocket: Event deleted, refreshing calendar')
      loadEvents(true)
    }

    window.addEventListener('event-created', handleEventCreated)
    window.addEventListener('event-updated', handleEventUpdated)
    window.addEventListener('event-deleted', handleEventDeleted)

    return () => {
      window.removeEventListener('event-created', handleEventCreated)
      window.removeEventListener('event-updated', handleEventUpdated)
      window.removeEventListener('event-deleted', handleEventDeleted)
    }
  }, [loadEvents])

  const filteredEvents = expandedEvents.filter(event => {
    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = filterCategory === 'all' || event.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const handleCalendarEventClick = (clickedEvent) => {
    console.log('📅 Calendar event clicked:', clickedEvent);

    // Get the original event ID (for recurring event instances)
    const eventId = clickedEvent.originalEventId || clickedEvent.id;

    // Find the original event from the events array
    const originalEvent = events.find(e => e.id === eventId);

    if (originalEvent) {
      setSelectedEvent(originalEvent);
      setShowEventModal(true);
    } else {
      // Fallback to showing all events on that day
      const eventDate = moment(clickedEvent.start).startOf('day').toDate();
      const sameDayEvents = filteredEvents.filter(event =>
        moment(event.start).isSame(eventDate, 'day')
      );
      setDayEvents(sameDayEvents);
      setSelectedDay(eventDate);
      setShowDayEventsModal(true);
    }
  }

  const handleEventListClick = (event) => {
    console.log('📋 Sidebar event clicked:', event);

    // Get the original event ID (for recurring event instances)
    const eventId = event.originalEventId || event.id;

    if (!eventId) {
      console.error('❌ Event has no ID, cannot open modal:', event);
      toast.error('This event has no ID and cannot be edited or deleted');
      return;
    }

    // Find the original event from the events array
    const originalEvent = events.find(e => e.id === eventId) || event;

    setSelectedEvent(originalEvent);
    setShowEventModal(true);
  }

  const handleShowMore = (events, date) => {
    console.log('🔍 Show more clicked for date:', date);
    console.log('🔍 Events for that date:', events);

    setDayEvents(events);
    setSelectedDay(date);
    setShowDayEventsModal(true);
  }

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({
      start,
      end,
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      attendees: [],
      location: '',
      reminders: [{ type: 'popup', minutes: 15 }],
      isAllDay: false,
      isRecurring: false,
      recurrence: null
    })
    setShowEventForm(true)
  }

  const handleCreateEvent = async (eventData) => {
    try {
      setError(null)
      const newEvent = await calendarAPI.createEvent(eventData)

      console.log('🆔 New event created:', newEvent);

      if (!newEvent.id) {
        throw new Error('Event created but no ID returned from server');
      }

      setEvents(prev => [...prev, newEvent])
      setShowEventForm(false)
      setSelectedEvent(null)

      if (sendEventCreated) {
        sendEventCreated(newEvent)
      }

      toast.success('Event created successfully!')
      loadEvents(true)
    } catch (error) {
      console.error('Error creating event:', error)
      setError(error.message)
      toast.error(error.message || 'Failed to create event')
    }
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      setError(null)

      if (!selectedEvent.id) {
        throw new Error('Cannot update event: No event ID found');
      }

      console.log('✏️ Updating event with ID:', selectedEvent.id);
      const updatedEvent = await calendarAPI.updateEvent(selectedEvent.id, eventData)
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updatedEvent : e))
      setShowEventModal(false)
      setShowEventForm(false)
      setSelectedEvent(null)

      if (sendEventUpdated) {
        sendEventUpdated(updatedEvent)
      }

      toast.success('Event updated successfully!')
      loadEvents(true)
    } catch (error) {
      console.error('Error updating event:', error)
      setError(error.message)
      toast.error(error.message || 'Failed to update event')
    }
  }

  // Handle accept event
  const handleAcceptEvent = async (event) => {
    try {
      setIsLoading(true)
      console.log('✅ Accepting event:', event.id)

      await calendarAPI.respondToEvent(event.id, 'accept')

      // SweetAlert success popup for accepted event
      Swal.fire({
        title: 'Event Accepted!',
        text: `You have accepted "${event.title}"`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10B981',
        background: '#f9fafb',
        iconColor: '#10B981'
      })

      await loadEvents(true)

      if (selectedEvent && selectedEvent.id === event.id) {
        const updatedEvents = await calendarAPI.getUserEvents()
        const updatedEvent = updatedEvents.find(e => e.id === event.id)
        if (updatedEvent) {
          setSelectedEvent(updatedEvent)
        }
      }
    } catch (error) {
      console.error('❌ Error accepting event:', error)
      toast.error(error.message || 'Failed to accept event')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle decline event with SweetAlert popup
  const handleDeclineEvent = async (event) => {
    try {
      setIsLoading(true)
      console.log('❌ Declining event:', event.id)

      // Show SweetAlert confirmation popup for decline
      const result = await Swal.fire({
        title: 'Decline Event?',
        text: `Are you sure you want to decline "${event.title}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Decline Event',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        background: '#f9fafb',
        iconColor: '#EF4444'
      })

      // If user confirms decline
      if (result.isConfirmed) {
        await calendarAPI.respondToEvent(event.id, 'decline')

        // SweetAlert success popup for declined event
        await Swal.fire({
          title: 'Event Declined!',
          text: `You have declined "${event.title}"`,
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6B7280',
          background: '#f9fafb',
          iconColor: '#EF4444'
        })

        await loadEvents(true)

        if (selectedEvent && selectedEvent.id === event.id) {
          const updatedEvents = await calendarAPI.getUserEvents()
          const updatedEvent = updatedEvents.find(e => e.id === event.id)
          if (updatedEvent) {
            setSelectedEvent(updatedEvent)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error declining event:', error)
      toast.error(error.message || 'Failed to decline event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    console.log('🔄 Delete requested for event ID:', eventId);

    if (!eventId) {
      console.error('❌ No event ID provided for deletion');
      toast.error('Cannot delete event: No event ID found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setIsLoading(true);

      console.log('🗑️ Proceeding with delete for ID:', eventId);

      await calendarAPI.deleteEvent(eventId);

      console.log('✅ Delete completed successfully');

      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowEventModal(false);
      setSelectedEvent(null);

      if (sendEventDeleted) {
        sendEventDeleted({ id: eventId });
      }

      toast.success('Event deleted successfully!');

    } catch (error) {
      console.error('❌ Delete failed:', error);
      toast.error(error.message || 'Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setError(null)
      setSearchQuery(query)

      if (query.trim()) {
        setIsRefreshing(true)
        const searchResults = await calendarAPI.searchUserEvents(query)
        setEvents(searchResults)
      } else {
        loadEvents(true)
      }
    } catch (error) {
      console.error('Error searching events:', error)
      setError(error.message)
      toast.error('Search failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCategoryFilter = async (category) => {
    try {
      setError(null)
      setFilterCategory(category)

      if (category !== 'all') {
        setIsRefreshing(true)
        const categoryEvents = await calendarAPI.getUserEventsByCategory(category)
        setEvents(categoryEvents)
      } else {
        loadEvents(true)
      }
    } catch (error) {
      console.error('Error filtering by category:', error)
      setError(error.message)
      toast.error('Filter failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEventFilterChange = (filter) => {
    setEventFilter(filter)
    setSearchQuery('')
    setFilterCategory('all')
  }

  const handleDateClick = (date) => {
    setDate(date)
    setView('day')
  }

  const handleMonthClick = (date) => {
    setDate(date)
    setView('month')
  }

  const handleRetryConnection = () => {
    testApiConnection()
    loadEvents(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader message="Loading your calendar..." />
          {connectionStatus === 'checking' && (
            <p className="mt-2 text-sm text-gray-500">Connecting to calendar service...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {connectionStatus === 'disconnected' && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Calendar service unavailable. {error && `Error: ${error}`}
              </span>
            </div>
            <button
              onClick={handleRetryConnection}
              className="text-sm bg-red-700 hover:bg-red-800 px-3 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg h-screen">
          {/* Header - Fixed */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  GageFX Calendar
                </h2>
                {currentUser && (
                  <>
                    <p className="text-sm text-blue-100 mt-1">
                      <p className="text-sm text-blue-100 mt-1">
                        {currentUser.username === 'itadmin.system' ? 'QC Manager' : (currentUser.gmail || currentUser.username)}
                      </p>
                    </p>
                  </>
                )}

              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center ${connectionStatus === 'connected' ? 'text-green-300' :
                  connectionStatus === 'checking' ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                  {connectionStatus === 'connected' ? (
                    <Wifi className="h-4 w-4" />
                  ) : connectionStatus === 'checking' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                </div>

                <button
                  onClick={() => loadEvents(true)}
                  disabled={isRefreshing}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
{/* 
            <button
              onClick={() => {
                setSelectedEvent({
                  start: new Date(),
                  end: new Date(Date.now() + 60 * 60 * 1000),
                  title: '',
                  description: '',
                  category: 'work',
                  priority: 'medium',
                  attendees: [],
                  location: '',
                  reminders: [{ type: 'popup', minutes: 15 }],
                  isAllDay: false,
                  isRecurring: false,
                  recurrence: null
                })
                setShowEventForm(true)
              }}
              disabled={connectionStatus === 'disconnected'}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </button> */}
            <ExportCalendarButton />
            <PreviewEvents />
          </div>

          {/* Summary Cards Section - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Summary Cards */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('summary')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Dashboard</span>
                </div>
                {expandedSections.summary ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expandedSections.summary && userStats && (
                <div className="px-6 pb-4">
                  <CalendarSummaryCards stats={userStats} events={events} />
                </div>
              )}
            </div>

            {/* Event Type Filter */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('eventType')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Event Type</span>
                  {userStats && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {userStats.total}
                    </span>
                  )}
                </div>
                {expandedSections.eventType ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expandedSections.eventType && (
                <div className="px-6 pb-4 space-y-2">
                  <button
                    onClick={() => handleEventFilterChange('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center ${eventFilter === 'all'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    All My Events
                    {userStats && (
                      <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {userStats.total}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleEventFilterChange('owned')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center ${eventFilter === 'owned'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Created by Me
                    {userStats && (
                      <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {userStats.byOwnership?.owned || 0}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleEventFilterChange('attending')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center ${eventFilter === 'attending'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Attending
                    {userStats && (
                      <span className="ml-auto bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        {userStats.byOwnership?.attending || 0}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Error Section */}
            {error && (
              <div className="p-6 border-b border-gray-200">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend Section - Updated with Category colors */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('legend')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  {expandedSections.legend ? (
                    <Eye className="h-4 w-4 mr-2 text-gray-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Event Colors</span>
                </div>
                {expandedSections.legend ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expandedSections.legend && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-gray-700 mb-2">By Category:</div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                        <span className="text-gray-600">Inward (Green)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-600 rounded mr-2"></div>
                        <span className="text-gray-600">Scheduled (Orange)</span>
                      </div>
                      
                      <div className="font-semibold text-gray-700 mt-3 mb-2">By Ownership:</div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                        <Crown className="h-3 w-3 mr-1 text-blue-600" />
                        <span className="text-gray-600">Created by you</span>
                      </div>

                      <div className="font-semibold text-gray-700 mt-3 mb-2">By Status:</div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-gray-600">Accepted</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-600 rounded mr-2"></div>
                        <Clock className="h-3 w-3 mr-1 text-yellow-600" />
                        <span className="text-gray-600">Pending</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                        <XCircle className="h-3 w-3 mr-1 text-red-600" />
                        <span className="text-gray-600">Declined</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded mr-2 opacity-60"></div>
                        <span className="text-gray-600">Past Events</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event List - Takes remaining space */}
            <EventList
              events={filteredEvents}
              onEventClick={handleEventListClick}
              currentDate={date}
            />
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-scroll ${connectionStatus === 'disconnected' ? 'mt-12' : ''}`}>
        <CalendarToolbar
          view={view}
          date={date}
          onNavigate={setDate}
          onViewChange={setView}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
          layout={calendarLayout}
          onLayoutChange={setCalendarLayout}
        />

        <div className="flex-1 p-6">
          {calendarLayout === 'calendar' ? (
            <div className="h-full">
              {view === 'year' ? (
                <YearView
                  date={date}
                  events={filteredEvents}
                  onEventClick={handleCalendarEventClick}
                  onDateClick={handleDateClick}
                  onMonthClick={handleMonthClick}
                />
              ) : (
                <Calendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  views={views.filter(v => v !== 'year')}
                  view={view}
                  date={date}
                  onNavigate={setDate}
                  onView={setView}
                  onSelectEvent={handleCalendarEventClick}
                  onSelectSlot={handleSelectSlot}
                  selectable={connectionStatus === 'connected'}
                  eventPropGetter={eventStyleGetter}
                  style={{ height: '100%' }}
                  dayLayoutAlgorithm="overlap"
                  doShowMoreDrillDown={false}
                  popup={false}
                  onShowMore={handleShowMore}
                  components={{
                    event: ({ event }) => {
                      const isPastEvent = moment(event.end).isBefore(moment())
                      const isDeclined = event.acceptanceStatus?.toUpperCase() === 'DECLINED'
                      const eventCategory = event.category?.toLowerCase() || ''

                      return (
                        <div className="flex items-center space-x-1 text-xs">
                          {isPastEvent && <span className="text-gray-500">✓</span>}
                          {eventCategory.includes('inward') && <span className="text-green-600 font-bold">📥</span>}
                          {eventCategory.includes('scheduled') && <span className="text-orange-600 font-bold">📅</span>}
                          {isDeclined && !isPastEvent && <span className="text-red-600 font-bold">✕</span>}
                          {event.userRelationship === 'owner' && !isPastEvent && !isDeclined && !eventCategory.includes('inward') && !eventCategory.includes('scheduled') && (
                            <Crown className="h-3 w-3" />
                          )}
                          {event.userRelationship === 'attendee' && event.acceptanceStatus?.toUpperCase() === 'ACCEPTED' && !isPastEvent && !eventCategory.includes('inward') && !eventCategory.includes('scheduled') && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {event.userRelationship === 'attendee' && (!event.acceptanceStatus || event.acceptanceStatus?.toUpperCase() === 'PENDING') && !isPastEvent && !isDeclined && !eventCategory.includes('inward') && !eventCategory.includes('scheduled') && (
                            <Clock className="h-3 w-3" />
                          )}
                          {event.isRecurring && (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          <span className="truncate">{event.title}</span>
                          {event.location && <MapPin className="h-3 w-3" />}
                          {event.attendees && event.attendees.length > 0 && <Users className="h-3 w-3" />}
                        </div>
                      )
                    }
                  }}
                  messages={{
                    allDay: 'All Day',
                    previous: 'Previous',
                    next: 'Next',
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                    agenda: 'Agenda',
                    date: 'Date',
                    time: 'Time',
                    event: 'Event',
                    noEventsInRange: connectionStatus === 'disconnected' ?
                      'Unable to load events. Please check your connection.' :
                      'No events in this range.',
                    showMore: total => `+${total} more`
                  }}
                />
              )}
            </div>
          ) : (
            <div className="h-full">
              <EventList
                events={filteredEvents}
                onEventClick={handleEventListClick}
                currentDate={date}
                detailed={true}
              />
            </div>
          )}
        </div>
      </div>

      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onEdit={() => {
            setShowEventModal(false)
            setShowEventForm(true)
          }}
          onDelete={(eventId) => {
            console.log('🔄 Parent received delete request for ID:', eventId);
            handleDeleteEvent(eventId);
          }}
          onAccept={handleAcceptEvent}
          onDecline={handleDeclineEvent}
          onRefresh={() => loadEvents(true)}
        />
      )}

      {/* {showEventForm && selectedEvent && (
        <EventForm
          event={selectedEvent}
          onClose={() => {
            setShowEventForm(false)
            setSelectedEvent(null)
          }}
          onSave={selectedEvent.id ? handleUpdateEvent : handleCreateEvent}
        />
      )} */}

      <DayEventsModal
        isOpen={showDayEventsModal}
        onClose={() => setShowDayEventsModal(false)}
        events={dayEvents}
        onEventClick={(event) => {
          const eventId = event.originalEventId || event.id;

          if (!eventId) {
            console.error('❌ Event has no ID, cannot open modal:', event);
            toast.error('This event has no ID and cannot be edited or deleted');
            return;
          }

          const originalEvent = events.find(e => e.id === eventId) || event;
          setSelectedEvent(originalEvent);
          setShowEventModal(true);
          setShowDayEventsModal(false);
        }}
        date={selectedDay}
      />
    </div>
  )
}