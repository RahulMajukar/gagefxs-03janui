import { X, Calendar, Clock, MapPin, Users, Tag, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import moment from 'moment'
import { useState,useEffect} from 'react'
import {
  getStatusText,
  getStatusIcon,
  getStatusBadgeClasses,
  getCategoryBadgeClasses,
  getPriorityBadgeClasses,
  canEditEvent,
  canDeleteEvent,
  canRespondToEvent,
  getEventColor
} from './eventColorUtil'
import Swal from 'sweetalert2'
import ScheduleCalibrationModal from '../../Pages/DepartmentDash/calibration/ScheduleCalibrationModal'

export default function EventModal({
  event,
  onClose,
  onEdit,
  onDelete,
  onAccept,
  onDecline,
  onRefresh // Add this to refresh event data after response
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedGageForSchedule, setSelectedGageForSchedule] = useState(null)

  const getGageNameFromEvent = (event) => {
    if (event.title.startsWith('calibration:')) {
      const parts = event.title.split(' - ');
      if (parts.length > 1) {
        return parts[1];
      }
    }
    return null;
  };

  useEffect(() => {
    if (showScheduleModal && event) {
      const fetchGage = async () => {
        const gageName = getGageNameFromEvent(event);
        if (gageName) {
          try {
            // Fetch gages by serial number (assuming API supports query param)
            const response = await fetch(`https://qsutrarmsclm.hub.swajyot.co.in:8458/api/calibration-manager/gages?serialNumber=${encodeURIComponent(gageName)}`);
            if (response.ok) {
              const gages = await response.json();
              if (gages.length > 0) {
                setSelectedGageForSchedule(gages[0]);
              } else {
                setSelectedGageForSchedule({ name: gageName, serialNumber: gageName, id: null });
              }
            } else {
              setSelectedGageForSchedule({ name: gageName, serialNumber: gageName, id: null });
            }
          } catch (err) {
            console.error('Failed to fetch gage:', err);
            setSelectedGageForSchedule({ name: gageName, serialNumber: gageName, id: null });
          }
        }
      };
      fetchGage();
    } else {
      setSelectedGageForSchedule(null);
    }
  }, [showScheduleModal, event]);

  if (!event) return null

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(event.id);

      Swal.fire({
        title: "Deleted!",
        text: "Event deleted successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });

      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete event");
      setIsDeleting(false);
    }
  };

  const handleAccept = async () => {
    setIsResponding(true)
    setError(null)
    setSuccess(null)

    try {
      await onAccept(event)
      setSuccess('✅ Event accepted successfully!')

      // Refresh event data to show updated status
      if (onRefresh) {
        setTimeout(() => {
          onRefresh()
        }, 1000)
      }
    } catch (err) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setIsResponding(false)
    }
  }

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return
    }

    setIsResponding(true)
    setError(null)
    setSuccess(null)

    try {
      await onDecline(event)
      setSuccess('Event declined successfully')

      // Refresh event data to show updated status
      if (onRefresh) {
        setTimeout(() => {
          onRefresh()
        }, 1000)
      }
    } catch (err) {
      setError(err.message || 'Failed to decline invitation')
    } finally {
      setIsResponding(false)
    }
  }

  const eventColor = getEventColor(event)
  const canEdit = canEditEvent(event)
  const canDel = canDeleteEvent(event)
  const canRespond = canRespondToEvent(event)

  const getSelectedGageFromEvent = (event) => {
    if (event.title.startsWith('calibration:')) {
      const parts = event.title.split(' - ');
      if (parts.length > 1) {
        const gageName = parts[1];
        return { 
          name: gageName, 
          serialNumber: gageName || '1', // Use '1' if empty
          id: gageName ? null : 1, // Use 1 as id if serialNumber is empty
          location: event.location || '' 
        };
      }
    }
    return { name: '', serialNumber: '1', id: 1, location: '' }; // Default fallback
  };

  const onScheduleSubmit = async (data) => {
    setShowScheduleModal(false);
    if (onRefresh) onRefresh();
  };

  // Helper function to get attendee status badge styling
  const getAttendeeStatusBadge = (status) => {
    const normalizedStatus = status?.toUpperCase()
    
    switch (normalizedStatus) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-700 border border-green-300'
      case 'DECLINED':
        return 'bg-red-100 text-red-700 border border-red-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300'
    }
  }

  // Helper function to get attendee status icon
  const getAttendeeStatusIcon = (status) => {
    const normalizedStatus = status?.toUpperCase()
    
    switch (normalizedStatus) {
      case 'ACCEPTED':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'DECLINED':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'PENDING':
        return <Clock className="h-3 w-3 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with color accent */}
        <div
          className="p-6 border-b border-gray-200"
          style={{ borderTop: `4px solid ${eventColor}` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{getStatusIcon(event)}</span>
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusBadgeClasses(event)}`}>
                  {getStatusText(event)}
                </span>

                {event.isRecurring && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700 border border-indigo-300">
                    🔄 Recurring
                  </span>
                )}

                {event.isAllDay && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700 border border-purple-300">
                    📅 All Day
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {moment(event.start).format('dddd, MMMM D, YYYY')}
                </p>
                {/* <p className="text-sm text-gray-600">
                  {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </p> */}
                {event.isAllDay && (
                  <p className="text-xs text-gray-500 mt-1">All-day event</p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700">{event.location}</p>
                </div>
              </div>
            )}

            {/* Attendees with detailed status */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-3">
                    Attendees ({event.attendees.length})
                  </p>
                  <div className="space-y-2">
                    {event.attendees.map((attendee, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {(attendee.name || attendee.username || attendee.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attendee.name || attendee.username || attendee.email}
                            </p>
                            {attendee.email && attendee.email !== attendee.username && (
                              <p className="text-xs text-gray-500">{attendee.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getAttendeeStatusIcon(attendee.status)}
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getAttendeeStatusBadge(attendee.status)}`}>
                            {attendee.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary statistics */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                          {event.attendees.filter(a => a.status?.toUpperCase() === 'ACCEPTED').length} Accepted
                        </span>
                        <span className="flex items-center">
                          <XCircle className="h-3 w-3 text-red-600 mr-1" />
                          {event.attendees.filter(a => a.status?.toUpperCase() === 'DECLINED').length} Declined
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 text-yellow-600 mr-1" />
                          {event.attendees.filter(a => a.status?.toUpperCase() === 'PENDING' || !a.status).length} Pending
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category & Priority */}
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 flex items-center space-x-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryBadgeClasses(event.category)}`}>
                  {event.category}
                </span>
                {event.priority && (
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityBadgeClasses(event.priority)}`}>
                    {event.priority} priority
                  </span>
                )}
              </div>
            </div>

            {/* Reminders */}
            {event.reminders && event.reminders.length > 0 && (
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-2">Reminders</p>
                  <div className="space-y-1">
                    {event.reminders.map((reminder, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {reminder.type} - {reminder.minutes} minutes before
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Created Info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Created {moment(event.createdAt).format('MMM D, YYYY h:mm A')}
              </p>
              {event.updatedAt && event.updatedAt !== event.createdAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated {moment(event.updatedAt).format('MMM D, YYYY h:mm A')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Accept/Decline Buttons (for attendees with pending status) */}
            {canRespond && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAccept}
                  disabled={isResponding}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isResponding ? 'Accepting...' : 'Accept'}</span>
                </button>

                <button
                  onClick={handleDecline}
                  disabled={isResponding}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{isResponding ? 'Declining...' : 'Decline'}</span>
                </button>
              </div>
            )}

            {/* Edit/Delete Buttons (for owners) */}
            {(canEdit || canDel) && !canRespond && (
              <div className="flex items-center space-x-3 ml-auto">
                {canEdit && (
                  <button
                    onClick={() => onEdit(event)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}

                {canDel && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                )}

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </button>
              </div>
            )}

            {/* Close Button (when no actions available) */}
            {!canRespond && !canEdit && !canDel && (
              <div className="flex items-center space-x-3 ml-auto">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Calibration Modal */}
      {showScheduleModal && (
        <ScheduleCalibrationModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          selectedGage={selectedGageForSchedule}
          onSubmit={onScheduleSubmit}
        />
      )}
    </div>
  )
}