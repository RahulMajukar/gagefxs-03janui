import { Clock, MapPin, Users, Calendar as CalendarIcon, Tag } from 'lucide-react'
import moment from 'moment'
import {
  getEventColor,
  getStatusText,
  getStatusIcon,
  getStatusBadgeClasses,
  getCategoryBadgeClasses,
  getPriorityBadgeClasses
} from './eventColorUtil'

export default function EventList({ events, onEventClick, currentDate, detailed = false }) {
  // Group events by date
  const groupEventsByDate = (events) => {
    const groups = {}
    
    events.forEach(event => {
      const dateKey = moment(event.start).format('YYYY-MM-DD')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    
    // Sort events within each group by start time
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => new Date(a.start) - new Date(b.start))
    })
    
    return groups
  }

  const formatTime = (date) => {
    return moment(date).format('h:mm A')
  }

  const formatDate = (date) => {
    const eventDate = moment(date)
    const today = moment()
    const tomorrow = moment().add(1, 'day')
    
    if (eventDate.isSame(today, 'day')) {
      return 'Today'
    } else if (eventDate.isSame(tomorrow, 'day')) {
      return 'Tomorrow'
    } else if (eventDate.isSame(today, 'week')) {
      return eventDate.format('dddd')
    } else {
      return eventDate.format('MMM DD, YYYY')
    }
  }

  const isEventToday = (date) => {
    return moment(date).isSame(moment(), 'day')
  }

  const isEventPast = (date) => {
    return moment(date).isBefore(moment(), 'day')
  }

  const groupedEvents = groupEventsByDate(events)
  const sortedDates = Object.keys(groupedEvents).sort()

  if (events.length === 0) {
    return (
      <div className="p-6 text-center">
        <CalendarIcon className="h-12 w-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">No events found</h3>
        <p className="text-red-500">
          {detailed ? 'No events match your current filters.' : 'Create your first event to get started.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`${detailed ? 'space-y-6' : 'space-y-4'} ${detailed ? 'p-6' : 'p-4'}`}>
      {sortedDates.map(dateKey => {
        const dateEvents = groupedEvents[dateKey]
        const eventDate = moment(dateKey)
        
        return (
          <div key={dateKey} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center space-x-3">
              <div className={`text-sm font-semibold ${
                isEventToday(eventDate) ? 'text-blue-600' : 
                isEventPast(eventDate) ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {formatDate(eventDate)}
              </div>
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="text-xs text-gray-500">
                {dateEvents.length} {dateEvents.length === 1 ? 'event' : 'events'}
              </div>
            </div>

            {/* Events for this date */}
            <div className="space-y-2">
              {dateEvents.map(event => {
                const eventColor = getEventColor(event)
                
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`
                      group cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md
                      ${detailed ? 'p-4' : 'p-3'}
                      ${isEventPast(event.start) ? 'opacity-75' : ''}
                    `}
                    style={{
                      borderLeft: `4px solid ${eventColor}`,
                      backgroundColor: `${eventColor}15`
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Status Icon */}
                      <div className="text-xl flex-shrink-0 mt-0.5">
                        {getStatusIcon(event)}
                      </div>
                      
                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title, Time and Status Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium truncate ${detailed ? 'text-base' : 'text-sm'} ${
                            isEventPast(event.start) ? 'text-red-500' : 'text-red-900'
                          }`}>
                            {event.title}
                          </h4>
                        </div>

                        {/* Status and Time Row */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusBadgeClasses(event)}`}>
                            {getStatusText(event)}
                          </span>
                          
                          <div className={`flex items-center text-xs ${
                            isEventPast(event.start) ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(event.start)}
                          </div>
                        </div>

                        {/* Details */}
                        {detailed && (
                          <div className="space-y-2">
                            {event.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-32">{event.location}</span>
                                </div>
                              )}
                              
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{event.attendees.length}</span>
                                </div>
                              )}
                              
                              <span className={`px-2 py-1 rounded-full ${getCategoryBadgeClasses(event.category)}`}>
                                {event.category}
                              </span>
                              
                              {event.isRecurring && (
                                <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                  🔄 Recurring
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Compact view details */}
                        {!detailed && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-20">{event.location}</span>
                                </div>
                              )}
                              
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{event.attendees.length}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadgeClasses(event.category)}`}>
                                {event.category}
                              </span>
                              
                              {event.isRecurring && (
                                <span className="text-xs">🔄</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}