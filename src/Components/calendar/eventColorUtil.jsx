/**
 * Get event color based on user relationship and acceptance status
 * Implements the color coding system from the backend
 */
export function getEventColor(event) {
  // Priority 1: Check if expired
  if (event.acceptanceStatus === 'expired') {
    return '#9CA3AF'; // Gray
  }
  
  // Priority 2: Owner events (user created the event)
  if (event.userRelationship === 'owner' || event.isOwner) {
    return '#3B82F6'; // Blue
  }
  
  // Priority 3: Attendee events (user was invited)
  if (event.userRelationship === 'attendee' || event.isAttendee) {
    switch (event.acceptanceStatus) {
      case 'accepted':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Yellow/Orange
      case 'declined':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  }
  
  // Default fallback
  return '#6B7280'; // Gray
}

/**
 * Get event background color with opacity
 */
export function getEventBackgroundColor(event) {
  const color = getEventColor(event);
  return `${color}20`; // Add 20 (~12% opacity)
}

/**
 * Get event border color
 */
export function getEventBorderColor(event) {
  return getEventColor(event);
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeClasses(event) {
  if (event.acceptanceStatus === 'expired') {
    return 'bg-gray-100 text-gray-700 border-gray-300';
  }
  
  if (event.userRelationship === 'owner' || event.isOwner) {
    return 'bg-blue-100 text-blue-700 border-blue-300';
  }
  
  if (event.userRelationship === 'attendee' || event.isAttendee) {
    switch (event.acceptanceStatus) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'declined':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }
  
  return 'bg-gray-100 text-gray-700 border-gray-300';
}

/**
 * Get status text for display
 */
export function getStatusText(event) {
  if (event.acceptanceStatus === 'expired') {
    return 'Expired';
  }
  
  if (event.userRelationship === 'owner' || event.isOwner) {
    return 'Owner';
  }
  
  if (event.userRelationship === 'attendee' || event.isAttendee) {
    switch (event.acceptanceStatus) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'declined':
        return 'Declined';
      default:
        return 'Unknown';
    }
  }
  
  return 'Unknown';
}

/**
 * Get status icon for display
 */
export function getStatusIcon(event) {
  if (event.acceptanceStatus === 'expired') {
    return '⏰';
  }
  
  if (event.userRelationship === 'owner' || event.isOwner) {
    return '👑';
  }
  
  if (event.userRelationship === 'attendee' || event.isAttendee) {
    switch (event.acceptanceStatus) {
      case 'accepted':
        return '✅';
      case 'pending':
        return '⏳';
      case 'declined':
        return '❌';
      default:
        return '❓';
    }
  }
  
  return '❓';
}

/**
 * Get category color
 */
export function getCategoryColor(category) {
  const colors = {
    work: '#3B82F6',      // Blue
    personal: '#8B5CF6',  // Purple
    health: '#EC4899',    // Pink
    education: '#14B8A6'  // Teal
  };
  return colors[category?.toLowerCase()] || '#6B7280';
}

/**
 * Get category badge classes
 */
export function getCategoryBadgeClasses(category) {
  const classes = {
    work: 'bg-blue-100 text-blue-700',
    personal: 'bg-purple-100 text-purple-700',
    health: 'bg-pink-100 text-pink-700',
    education: 'bg-teal-100 text-teal-700'
  };
  return classes[category?.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

/**
 * Get priority badge classes
 */
export function getPriorityBadgeClasses(priority) {
  const classes = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };
  return classes[priority?.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

/**
 * Check if user can edit event
 */
export function canEditEvent(event) {
  return event.userRelationship === 'owner' || event.isOwner;
}

/**
 * Check if user can delete event
 */
export function canDeleteEvent(event) {
  return event.userRelationship === 'owner' || event.isOwner;
}

/**
 * Check if user can accept/decline event
 */
export function canRespondToEvent(event) {
  return (
    (event.userRelationship === 'attendee' || event.isAttendee) &&
    event.acceptanceStatus === 'pending' &&
    event.acceptanceStatus !== 'expired'
  );
}

/**
 * Format event for calendar display
 */
export function formatEventForCalendar(event) {
  return {
    ...event,
    title: event.title,
    start: new Date(event.start),
    end: new Date(event.end),
    resource: {
      ...event,
      backgroundColor: getEventBackgroundColor(event),
      borderColor: getEventBorderColor(event),
      textColor: '#000000',
    }
  };
}

/**
 * Apply color coding styles to event element
 */
export function applyEventStyles(event) {
  const color = getEventColor(event);
  return {
    backgroundColor: `${color}20`,
    borderLeft: `4px solid ${color}`,
    color: '#000000',
  };
}