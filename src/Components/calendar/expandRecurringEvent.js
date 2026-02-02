import moment from 'moment'

/**
 * Expands a recurring event into individual occurrences for calendar display
 * @param {Object} event - The recurring event object
 * @param {Date} viewStart - Start of calendar view (e.g., start of month)
 * @param {Date} viewEnd - End of calendar view (e.g., end of month)
 * @returns {Array} Array of individual event occurrences
 */
export function expandRecurringEvent(event, viewStart, viewEnd) {
  // If not recurring, return original event
  if (!event.isRecurring || !event.recurrence) {
    return [event]
  }

  const occurrences = []
  const { frequency, interval, endType, occurrences: maxOccurrences, endDate, daysOfWeek, dayOfMonth, month } = event.recurrence
  
  let currentDate = moment(event.start)
  const eventDuration = moment(event.end).diff(moment(event.start))
  const viewStartMoment = moment(viewStart)
  const viewEndMoment = moment(viewEnd)
  
  // Determine when to stop generating occurrences
  let maxDate = viewEndMoment.clone()
  if (endType === 'on-date' && endDate) {
    maxDate = moment.min(maxDate, moment(endDate))
  }
  
  let count = 0
  const maxIterations = endType === 'after' ? maxOccurrences : 1000 // Safety limit
  
  while (currentDate.isSameOrBefore(maxDate) && count < maxIterations) {
    // Check if this occurrence is within the view range
    if (currentDate.isSameOrAfter(viewStartMoment) && currentDate.isSameOrBefore(viewEndMoment)) {
      // For weekly recurrence, check if current day matches daysOfWeek
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        if (daysOfWeek.includes(currentDate.day())) {
          occurrences.push(createOccurrence(event, currentDate, eventDuration, count))
        }
      } else {
        // For other frequencies, always add
        occurrences.push(createOccurrence(event, currentDate, eventDuration, count))
      }
    }
    
    count++
    
    // Move to next occurrence based on frequency
    currentDate = getNextOccurrence(currentDate, frequency, interval, daysOfWeek, dayOfMonth, month)
    
    // Stop if we've reached the occurrence limit
    if (endType === 'after' && count >= maxOccurrences) {
      break
    }
  }
  
  return occurrences
}

/**
 * Creates an individual occurrence from a recurring event
 */
function createOccurrence(event, occurrenceDate, duration, index) {
  const start = occurrenceDate.toDate()
  const end = moment(occurrenceDate).add(duration, 'milliseconds').toDate()
  
  return {
    ...event,
    id: `${event.id}-occurrence-${index}`, // Unique ID for each occurrence
    originalEventId: event.id, // Reference to parent event
    start,
    end,
    isRecurrenceInstance: true, // Mark as instance
    occurrenceIndex: index
  }
}

/**
 * Calculates the next occurrence date based on recurrence rules
 */
function getNextOccurrence(currentDate, frequency, interval, daysOfWeek, dayOfMonth, month) {
  const next = currentDate.clone()
  
  switch (frequency) {
    case 'daily':
      return next.add(interval, 'days')
    
    case 'weekly':
      // For weekly, we need to handle daysOfWeek specially
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Sort days of week
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
        const currentDay = next.day()
        
        // Find next day in the array
        let nextDay = sortedDays.find(day => day > currentDay)
        
        if (nextDay !== undefined) {
          // Next occurrence is within the same week
          return next.day(nextDay)
        } else {
          // Next occurrence is in the next interval
          return next.add(interval, 'weeks').day(sortedDays[0])
        }
      } else {
        return next.add(interval, 'weeks')
      }
    
    case 'monthly':
      if (dayOfMonth) {
        next.add(interval, 'months')
        // Ensure we don't exceed the number of days in the month
        const daysInMonth = next.daysInMonth()
        next.date(Math.min(dayOfMonth, daysInMonth))
        return next
      }
      return next.add(interval, 'months')
    
    case 'yearly':
      next.add(interval, 'years')
      if (month !== undefined) {
        next.month(month)
      }
      if (dayOfMonth) {
        const daysInMonth = next.daysInMonth()
        next.date(Math.min(dayOfMonth, daysInMonth))
      }
      return next
    
    default:
      return next.add(interval, 'days')
  }
}

/**
 * Expands all recurring events in an array
 * @param {Array} events - Array of events (some may be recurring)
 * @param {Date} viewStart - Start of calendar view
 * @param {Date} viewEnd - End of calendar view
 * @returns {Array} Array with all events expanded
 */
export function expandAllRecurringEvents(events, viewStart, viewEnd) {
  const expandedEvents = []
  
  events.forEach(event => {
    if (event.isRecurring) {
      // Expand recurring event into occurrences
      const occurrences = expandRecurringEvent(event, viewStart, viewEnd)
      expandedEvents.push(...occurrences)
    } else {
      // Keep non-recurring events as-is
      expandedEvents.push(event)
    }
  })
  
  return expandedEvents
}

/**
 * Gets the visible date range for calendar view
 * @param {Date} currentDate - Currently displayed date
 * @param {String} view - Calendar view ('month', 'week', 'day', 'agenda')
 * @returns {Object} { start, end } dates
 */
export function getCalendarViewRange(currentDate, view = 'month') {
  const current = moment(currentDate)
  
  switch (view) {
    case 'month':
      return {
        start: current.clone().startOf('month').subtract(7, 'days').toDate(),
        end: current.clone().endOf('month').add(7, 'days').toDate()
      }
    
    case 'week':
      return {
        start: current.clone().startOf('week').toDate(),
        end: current.clone().endOf('week').toDate()
      }
    
    case 'day':
      return {
        start: current.clone().startOf('day').toDate(),
        end: current.clone().endOf('day').toDate()
      }
    
    case 'agenda':
      return {
        start: current.clone().toDate(),
        end: current.clone().add(30, 'days').toDate()
      }
    
    default:
      return {
        start: current.clone().startOf('month').toDate(),
        end: current.clone().endOf('month').toDate()
      }
  }
}

/**
 * Formats recurrence description for display
 */
export function getRecurrenceDescription(recurrence) {
  if (!recurrence) return ''

  const { frequency, interval, endType, occurrences, endDate, daysOfWeek, dayOfMonth, month } = recurrence
  
  let description = `Repeats every ${interval > 1 ? interval + ' ' : ''}`
  
  const getDayName = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[dayIndex]
  }
  
  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[monthIndex]
  }
  
  switch (frequency) {
    case 'daily':
      description += interval === 1 ? 'day' : 'days'
      break
    case 'weekly':
      description += interval === 1 ? 'week' : 'weeks'
      if (daysOfWeek && daysOfWeek.length > 0) {
        description += ` on ${daysOfWeek.map(day => getDayName(day)).join(', ')}`
      }
      break
    case 'monthly':
      description += interval === 1 ? 'month' : 'months'
      if (dayOfMonth) {
        description += ` on day ${dayOfMonth}`
      }
      break
    case 'yearly':
      description += interval === 1 ? 'year' : 'years'
      if (month !== undefined) {
        description += ` in ${getMonthName(month)}`
      }
      break
  }

  switch (endType) {
    case 'after':
      description += `, ${occurrences} times`
      break
    case 'on-date':
      description += `, until ${moment(endDate).format('MMM D, YYYY')}`
      break
    case 'never':
      description += ', indefinitely'
      break
  }

  return description
}