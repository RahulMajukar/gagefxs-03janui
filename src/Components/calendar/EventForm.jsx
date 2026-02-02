import { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  X, Plus, Minus, Calendar, Clock, MapPin, Users, FileText, Tag,
  AlertTriangle, Bell, Save, Check, Eye, EyeOff, Info, Star,
  Globe, Lock, Repeat, Trash2, Copy, Palette, Paperclip,
  ChevronDown, ChevronRight
} from 'lucide-react'
import moment from 'moment'
import Swal from 'sweetalert2'

// Validation schema using Yup
const eventSchema = yup.object().shape({
  title: yup
    .string()
    .required('Event title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: yup
    .string()
    .max(2000, 'Description must be less than 2000 characters'),
  start: yup
    .date()
    .required('Start date is required')
    .min(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'Start date cannot be more than one year in the past'),
  end: yup
    .date()
    .required('End date is required')
    .min(yup.ref('start'), 'End time must be after start time'),
  category: yup
    .string()
    .oneOf(['work', 'personal', 'health', 'education'], 'Invalid category')
    .required('Category is required'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Invalid priority')
    .required('Priority is required'),
  location: yup
    .string()
    .max(500, 'Location must be less than 500 characters'),
  attendees: yup
    .array()
    .of(
      yup.string()
        .email('Please enter a valid email address')
        .required('Email is required')
    ),
  reminders: yup
    .array()
    .of(
      yup.object().shape({
        type: yup.string().oneOf(['popup', 'email'], 'Invalid reminder type'),
        minutes: yup
          .number()
          .min(0, 'Minutes cannot be negative')
          .max(10080, 'Reminder cannot be more than 1 week (10080 minutes)')
          .required('Minutes is required')
      })
    )
    .min(1, 'At least one reminder is required'),
  isAllDay: yup.boolean(),
  allDayType: yup
    .string()
    .oneOf(['single-day', 'multi-day'], 'Invalid all-day type'),
  isRecurring: yup.boolean(),
  recurrence: yup.object().shape({
    frequency: yup.string().oneOf(['daily', 'weekly', 'monthly', 'yearly']),
    interval: yup.number().min(1).max(365),
    endType: yup.string().oneOf(['never', 'after', 'on-date']),
    occurrences: yup.number().min(1).max(999).nullable(),
    endDate: yup.date().nullable(),
    daysOfWeek: yup.array().of(yup.number().min(0).max(6)).nullable(),
    dayOfMonth: yup.number().min(1).max(31).nullable(),
    month: yup.number().min(0).max(11).nullable()
  }).nullable().default(null)
})

export default function EventForm({ event, onClose, onSave }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [showPreview, setShowPreview] = useState(false)
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false)

  console.log('🔧 EventForm component loaded')
  console.log('📋 Received event prop:', event)
  console.log('🆔 Event ID:', event?.id)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty, touchedFields }
  } = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
      category: 'work',
      priority: 'medium',
      location: '',
      attendees: [],
      reminders: [{ type: 'popup', minutes: 15 }],
      isAllDay: false,
      allDayType: 'single-day',
      isRecurring: false,
      recurrence: null
    },
    mode: 'onChange'
  })

  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({
    control,
    name: 'attendees'
  })

  const { fields: reminderFields, append: appendReminder, remove: removeReminder } = useFieldArray({
    control,
    name: 'reminders'
  })

  const watchedStart = watch('start')
  const watchedEnd = watch('end')
  const watchedTitle = watch('title')
  const watchedCategory = watch('category')
  const watchedPriority = watch('priority')
  const watchedIsAllDay = watch('isAllDay')
  const watchedAllDayType = watch('allDayType')
  const watchedIsRecurring = watch('isRecurring')
  const watchedRecurrence = watch('recurrence')

  // ============================================================================
  // CRITICAL FIX: Helper functions for proper datetime handling
  // ============================================================================

  /**
   * Converts a Date object to datetime-local format string (YYYY-MM-DDTHH:mm)
   * WITHOUT any timezone conversion - preserves the exact date/time values
   */
  const formatDateTimeForInput = (date) => {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  /**
   * Converts a Date object to date format string (YYYY-MM-DD)
   * WITHOUT any timezone conversion
   */
  const formatDateForInput = (date) => {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  /**
   * Parses datetime-local input string to Date object
   * WITHOUT timezone conversion - creates date in local timezone
   */
  const parseDateTimeFromInput = (inputValue) => {
    if (!inputValue) return new Date()
    
    // Input format: "2024-12-08T14:30"
    const [datePart, timePart] = inputValue.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    // Create date in LOCAL timezone (not UTC)
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
  }

  /**
   * Parses date input string to Date object for all-day events
   */
  const parseDateFromInput = (inputValue) => {
    if (!inputValue) return new Date()
    
    // Input format: "2024-12-08"
    const [year, month, day] = inputValue.split('-').map(Number)
    
    // For all-day events, set to start of day in local timezone
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  // ============================================================================
  // Load event data when editing
  // ============================================================================
  useEffect(() => {
    if (event) {
      const parseDate = (dateValue) => {
        if (!dateValue) return new Date()
        if (dateValue instanceof Date) return dateValue
        return new Date(dateValue)
      }

      const eventData = {
        title: event.title || '',
        description: event.description || '',
        start: parseDate(event.start),
        end: parseDate(event.end),
        category: event.category || 'work',
        priority: event.priority || 'medium',
        location: event.location || '',
        attendees: Array.isArray(event.attendees) ? event.attendees : [],
        reminders: Array.isArray(event.reminders) && event.reminders.length > 0
          ? event.reminders.map(r => ({
            type: r.type || 'popup',
            minutes: parseInt(r.minutes) || 15
          }))
          : [{ type: 'popup', minutes: 15 }],
        isAllDay: Boolean(event.isAllDay),
        allDayType: event.allDayType || 'single-day',
        isRecurring: Boolean(event.isRecurring),
      }

      // Handle recurrence data safely
      if (event.isRecurring && event.recurrence) {
        eventData.recurrence = {
          frequency: event.recurrence.frequency || 'weekly',
          interval: event.recurrence.interval || 1,
          endType: event.recurrence.endType || 'never',
          occurrences: event.recurrence.occurrences || 10,
          endDate: event.recurrence.endDate ? parseDate(event.recurrence.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          daysOfWeek: Array.isArray(event.recurrence.daysOfWeek) ? event.recurrence.daysOfWeek : [moment(event.start).day()],
          dayOfMonth: event.recurrence.dayOfMonth || moment(event.start).date(),
          month: event.recurrence.month !== undefined ? event.recurrence.month : moment(event.start).month()
        }
      } else {
        eventData.recurrence = null
      }

      reset(eventData)

      if (event.isRecurring) {
        setShowRecurrenceOptions(true)
      }
    }
  }, [event, reset])

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (watchedStart && watchedEnd) {
      const startDate = new Date(watchedStart)
      const endDate = new Date(watchedEnd)

      if (endDate <= startDate) {
        setValue('end', new Date(startDate.getTime() + (60 * 60 * 1000)), { shouldValidate: true })
      }
    }
  }, [watchedStart, setValue, watchedEnd])

  // Handle all-day event logic
  useEffect(() => {
    if (watchedIsAllDay && watchedStart) {
      const startDate = new Date(watchedStart)

      if (watchedAllDayType === 'single-day') {
        // Set end time to same day at 11:59 PM
        const endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        setValue('end', endDate, { shouldValidate: true })
      } else if (watchedAllDayType === 'multi-day') {
        // Set end time to next day at 11:59 PM
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        endDate.setHours(23, 59, 59, 999)
        setValue('end', endDate, { shouldValidate: true })
      }
    }
  }, [watchedIsAllDay, watchedAllDayType, watchedStart, setValue])

  // Initialize recurrence options when enabling recurring
  useEffect(() => {
    if (watchedIsRecurring && !watchedRecurrence) {
      const startDate = moment(watchedStart)
      setValue('recurrence', {
        frequency: 'weekly',
        interval: 1,
        endType: 'never',
        occurrences: 10,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        daysOfWeek: [startDate.day()],
        dayOfMonth: startDate.date(),
        month: startDate.month()
      }, { shouldValidate: true })
    } else if (!watchedIsRecurring && watchedRecurrence) {
      // Clear recurrence when disabling
      setValue('recurrence', null, { shouldValidate: true })
    }
  }, [watchedIsRecurring, watchedRecurrence, watchedStart, setValue])

  // ============================================================================
  // Submit handler
  // ============================================================================
  const onSubmit = async (data) => {
    console.log('🚀 Submitting form data:', data)
    console.log('🕐 Start Date Object:', data.start)
    console.log('🕐 Start ISO String:', data.start.toISOString())
    console.log('🕐 Start Local String:', data.start.toString())
    console.log('🕐 End Date Object:', data.end)
    console.log('🕐 End ISO String:', data.end.toISOString())
    console.log('🕐 End Local String:', data.end.toString())

    setIsLoading(true)

    try {
      const submitData = {
        ...data,
        start: data.start, // Already a proper Date object in local timezone
        end: data.end,     // Already a proper Date object in local timezone
        color: selectedColor
      }

      console.log('📤 Final data being sent:', submitData)
      await onSave(submitData)

      Swal.fire({
        title: event?.id ? 'Event Updated!' : 'Event Created!',
        text: event?.id
          ? `"${data.title}" has been successfully updated.`
          : `"${data.title}" has been added to your calendar.`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3B82F6',
      })

    } catch (error) {
      console.error('❌ Error saving event:', error)

      Swal.fire({
        title: 'Save Failed',
        text: error.message || 'Failed to save event. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#EF4444',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      work: '💼',
      personal: '👤',
      health: '🏥',
      education: '📚'
    }
    return icons[category] || '📅'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayIndex]
  }

  const getShortDayName = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[dayIndex]
  }

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return months[monthIndex]
  }

  const getRecurrenceDescription = (recurrence) => {
    if (!recurrence) return ''

    const { frequency, interval, endType, occurrences, endDate, daysOfWeek, dayOfMonth, month } = recurrence

    let description = `Repeats every ${interval > 1 ? interval + ' ' : ''}`

    switch (frequency) {
      case 'daily':
        description += interval === 1 ? 'day' : 'days'
        break
      case 'weekly':
        description += interval === 1 ? 'week' : 'weeks'
        if (daysOfWeek && daysOfWeek.length > 0) {
          description += ` on ${daysOfWeek.map(day => getShortDayName(day)).join(', ')}`
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
        description += ''
        break
    }

    return description
  }

  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  const quickTimePresets = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '4 hours', minutes: 240 },
    { label: 'All day', isAllDay: true }
  ]

  const reminderPresets = [
    { label: 'At time', minutes: 0 },
    { label: '5 min', minutes: 5 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '1 day', minutes: 1440 }
  ]

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Repeat every day' },
    { value: 'weekly', label: 'Weekly', description: 'Repeat every week' },
    { value: 'monthly', label: 'Monthly', description: 'Repeat every month' },
    { value: 'yearly', label: 'Yearly', description: 'Repeat every year' }
  ]

  const endTypeOptions = [
    { value: 'never', label: 'Never', description: 'Repeat indefinitely' },
    { value: 'after', label: 'After', description: 'End after occurrences' },
    { value: 'on-date', label: 'On date', description: 'End on specific date' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Enhanced Header with gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {event?.id ? 'Edit Event' : 'Create New Event'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {watchedTitle || 'Untitled Event'} • {getCategoryIcon(watchedCategory)} {watchedCategory}
                  {watchedIsRecurring && (
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                      🔄 Recurring
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Preview"
              >
                {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Object.keys(touchedFields).length * 10}%` }}
            />
          </div>
        </div>

        <div className="flex">
          {/* Main Form */}
          <div className={`${showPreview ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[calc(95vh-200px)] overflow-y-auto custom-scrollbar">

              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Quick setup:</span>
                  {quickTimePresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (preset.isAllDay) {
                          setValue('isAllDay', true, { shouldValidate: true })
                          setValue('allDayType', 'single-day', { shouldValidate: true })
                        } else {
                          const start = new Date(watchedStart)
                          setValue('end', new Date(start.getTime() + preset.minutes * 60 * 1000), { shouldValidate: true })
                        }
                      }}
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              </div>

              {/* Title with enhanced styling */}
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      Event Title *
                      {watchedTitle && (
                        <Check className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </label>
                    <div className="relative">
                      <input
                        {...field}
                        type="text"
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${errors.title
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : field.value
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-4 focus:ring-opacity-20`}
                        placeholder="Enter a descriptive title for your event"
                        maxLength={255}
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-3 text-xs text-gray-400">
                        {field.value?.length || 0}/255
                      </div>
                    </div>
                    {errors.title && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.title.message}
                      </div>
                    )}
                  </div>
                )}
              />

              {/* Enhanced All Day Event Options */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Controller
                  name="isAllDay"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        {...field}
                        type="checkbox"
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-all duration-200 ${field.value ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${field.value ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">All day event</span>
                    </label>
                  )}
                />

                {watchedIsAllDay && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                    <label className="block text-sm font-medium text-gray-700">
                      All-day event type:
                    </label>
                    <Controller
                      name="allDayType"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => field.onChange('single-day')}
                            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${field.value === 'single-day'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">📅 Single Day</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Event lasts the entire day
                                </div>
                              </div>
                              {field.value === 'single-day' && (
                                <Check className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('multi-day')}
                            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${field.value === 'multi-day'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">📆 Multi Day</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Event spans multiple days
                                </div>
                              </div>
                              {field.value === 'multi-day' && (
                                <Check className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* ============================================================================
                  FIXED: Date and Time Inputs with Proper Timezone Handling
                  ============================================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="start"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        {watchedIsAllDay ? 'Start Date' : 'Start Date & Time'} *
                      </label>
                      <input
                        type={watchedIsAllDay ? "date" : "datetime-local"}
                        value={watchedIsAllDay 
                          ? formatDateForInput(field.value) 
                          : formatDateTimeForInput(field.value)
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value
                          console.log('🕐 Start input changed:', inputValue)
                          
                          if (watchedIsAllDay) {
                            const newDate = parseDateFromInput(inputValue)
                            console.log('🕐 Parsed all-day start:', newDate)
                            field.onChange(newDate)
                          } else {
                            const newDate = parseDateTimeFromInput(inputValue)
                            console.log('🕐 Parsed regular start:', newDate)
                            console.log('🕐 Hours:', newDate.getHours(), 'Minutes:', newDate.getMinutes())
                            field.onChange(newDate)
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${errors.start
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-4 focus:ring-opacity-20`}
                        disabled={isLoading}
                      />
                      {errors.start && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.start.message}
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="end"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        {watchedIsAllDay ? 'End Date' : 'End Date & Time'} *
                        {watchedStart && watchedEnd && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {watchedIsAllDay
                              ? `Duration: ${Math.ceil((new Date(watchedEnd) - new Date(watchedStart)) / (1000 * 60 * 60 * 24))} days`
                              : `Duration: ${moment.duration(moment(watchedEnd).diff(moment(watchedStart))).humanize()}`
                            }
                          </span>
                        )}
                      </label>
                      <input
                        type={watchedIsAllDay ? "date" : "datetime-local"}
                        value={watchedIsAllDay 
                          ? formatDateForInput(field.value) 
                          : formatDateTimeForInput(field.value)
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value
                          console.log('🕐 End input changed:', inputValue)
                          
                          if (watchedIsAllDay) {
                            const newDate = parseDateFromInput(inputValue)
                            console.log('🕐 Parsed all-day end:', newDate)
                            field.onChange(newDate)
                          } else {
                            const newDate = parseDateTimeFromInput(inputValue)
                            console.log('🕐 Parsed regular end:', newDate)
                            console.log('🕐 Hours:', newDate.getHours(), 'Minutes:', newDate.getMinutes())
                            field.onChange(newDate)
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${errors.end
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-4 focus:ring-opacity-20`}
                        disabled={isLoading}
                      />
                      {errors.end && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.end.message}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Enhanced Recurring Event Section */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Controller
                  name="isRecurring"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        {...field}
                        type="checkbox"
                        className="sr-only"
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e.target.checked)
                          if (e.target.checked) {
                            setShowRecurrenceOptions(true)
                          }
                        }}
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-all duration-200 ${field.value ? 'bg-purple-600' : 'bg-gray-300'
                        }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${field.value ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 flex items-center">
                        <Repeat className="h-4 w-4 mr-1" />
                        Recurring event
                      </span>
                    </label>
                  )}
                />

                {watchedIsRecurring && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Recurrence Pattern:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
                        className="flex items-center text-sm text-purple-600 hover:text-purple-700"
                      >
                        {showRecurrenceOptions ? 'Hide Options' : 'Show Options'}
                        {showRecurrenceOptions ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                      </button>
                    </div>

                    {/* Recurrence Summary */}
                    {watchedRecurrence && (
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="text-sm font-medium text-gray-700">
                          {getRecurrenceDescription(watchedRecurrence)}
                        </div>
                      </div>
                    )}

                    {showRecurrenceOptions && watchedRecurrence && (
                      <div className="space-y-4">
                        {/* Frequency Selection */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Repeat every:
                          </label>
                          <div className="flex items-center space-x-3">
                            <Controller
                              name="recurrence.interval"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  min="1"
                                  max="365"
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              )}
                            />
                            <Controller
                              name="recurrence.frequency"
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                >
                                  {frequencyOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>
                        </div>

                        {/* Weekly Options */}
                        {watchedRecurrence.frequency === 'weekly' && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Repeat on:
                            </label>
                            <Controller
                              name="recurrence.daysOfWeek"
                              control={control}
                              render={({ field }) => (
                                <div className="grid grid-cols-7 gap-2">
                                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                                    <button
                                      key={dayIndex}
                                      type="button"
                                      onClick={() => {
                                        const currentDays = field.value || []
                                        const newDays = currentDays.includes(dayIndex)
                                          ? currentDays.filter(d => d !== dayIndex)
                                          : [...currentDays, dayIndex]
                                        field.onChange(newDays)
                                      }}
                                      className={`p-2 text-center text-sm rounded-lg border transition-all duration-200 ${field.value?.includes(dayIndex)
                                        ? 'bg-purple-500 text-white border-purple-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                                        }`}
                                    >
                                      {getShortDayName(dayIndex).charAt(0)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            />
                            {errors.recurrence?.daysOfWeek && (
                              <p className="text-red-600 text-sm">{errors.recurrence.daysOfWeek.message}</p>
                            )}
                          </div>
                        )}

                        {/* Monthly Options */}
                        {watchedRecurrence.frequency === 'monthly' && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Day of month:
                            </label>
                            <Controller
                              name="recurrence.dayOfMonth"
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                >
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>
                                      Day {day}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>
                        )}

                        {/* Yearly Options */}
                        {watchedRecurrence.frequency === 'yearly' && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Repeat in:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <Controller
                                name="recurrence.month"
                                control={control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i} value={i}>
                                        {getMonthName(i)}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              />
                              <Controller
                                name="recurrence.dayOfMonth"
                                control={control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                      <option key={day} value={day}>
                                        Day {day}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {/* End Options */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Ends:
                          </label>
                          <Controller
                            name="recurrence.endType"
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2">
                                {endTypeOptions.map(option => (
                                  <label key={option.value} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                                    <input
                                      type="radio"
                                      value={option.value}
                                      checked={field.value === option.value}
                                      onChange={() => field.onChange(option.value)}
                                      className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-700">{option.label}</div>
                                      <div className="text-sm text-gray-500">{option.description}</div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          />

                          {/* Occurrences Input */}
                          {watchedRecurrence.endType === 'after' && (
                            <div className="flex items-center space-x-3">
                              <label className="text-sm text-gray-700">After</label>
                              <Controller
                                name="recurrence.occurrences"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    min="1"
                                    max="999"
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                )}
                              />
                              <span className="text-sm text-gray-700">occurrences</span>
                            </div>
                          )}

                          {/* End Date Input */}
                          {watchedRecurrence.endType === 'on-date' && (
                            <div>
                              <label className="block text-sm text-gray-700 mb-2">End date:</label>
                              <Controller
                                name="recurrence.endDate"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="date"
                                    value={formatDateForInput(field.value)}
                                    onChange={(e) => field.onChange(parseDateFromInput(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  />
                                )}
                              />
                              {errors.recurrence?.endDate && (
                                <p className="text-red-600 text-sm">{errors.recurrence.endDate.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Tag className="h-4 w-4 mr-2" />
                        Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['work', 'personal', 'health', 'education'].map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => field.onChange(category)}
                            className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${field.value === category
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                          >
                            <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                            <div className="text-sm font-medium capitalize">{category}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                />

                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Star className="h-4 w-4 mr-2" />
                        Priority
                      </label>
                      <div className="space-y-2">
                        {['low', 'medium', 'high'].map((priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => field.onChange(priority)}
                            className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-200 ${field.value === priority
                              ? getPriorityColor(priority) + ' border-opacity-100'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="capitalize font-medium">{priority}</span>
                              <div className="flex">
                                {Array.from({ length: priority === 'high' ? 3 : priority === 'medium' ? 2 : 1 }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-current" />
                                ))}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Location with enhanced UI */}
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </label>
                    <div className="relative">
                      <input
                        {...field}
                        type="text"
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${errors.location
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-4 focus:ring-opacity-20`}
                        placeholder="Enter event location or online meeting link"
                        maxLength={500}
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-3 text-xs text-gray-400">
                        {field.value?.length || 0}/500
                      </div>
                    </div>
                    {errors.location && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.location.message}
                      </div>
                    )}
                  </div>
                )}
              />

              {/* Description with rich text features */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Description
                    </label>
                    <div className="relative">
                      <textarea
                        {...field}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 resize-none ${errors.description
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-4 focus:ring-opacity-20`}
                        placeholder="Add event details, agenda, or notes..."
                        maxLength={2000}
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                        {field.value?.length || 0}/2000
                      </div>
                    </div>
                    {errors.description && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.description.message}
                      </div>
                    )}
                  </div>
                )}
              />

              {/* Enhanced Attendees Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Users className="h-4 w-4 mr-2" />
                    Attendees ({attendeeFields.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => appendAttendee('')}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Attendee
                  </button>
                </div>

                {attendeeFields.length > 0 && (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {attendeeFields.map((field, index) => (
                      <Controller
                        key={field.id}
                        name={`attendees.${index}`}
                        control={control}
                        render={({ field: attendeeField }) => (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <input
                                {...attendeeField}
                                type="email"
                                className={`w-full px-3 py-2 border rounded-lg ${errors.attendees?.[index]
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-gray-300 focus:border-blue-500'
                                  } focus:ring-2 focus:ring-opacity-20`}
                                placeholder="Enter email address"
                                disabled={isLoading}
                              />
                              {errors.attendees?.[index] && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.attendees[index].message}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttendee(index)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Reminders Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Bell className="h-4 w-4 mr-2" />
                    Reminders ({reminderFields.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => appendReminder({ type: 'popup', minutes: 30 })}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reminder
                  </button>
                </div>

                {/* Quick reminder presets */}
                <div className="flex flex-wrap gap-2">
                  {reminderPresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => appendReminder({ type: 'popup', minutes: preset.minutes })}
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {reminderFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Controller
                        name={`reminders.${index}.type`}
                        control={control}
                        render={({ field: typeField }) => (
                          <select
                            {...typeField}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-20"
                            disabled={isLoading}
                          >
                            <option value="popup">🔔 Popup</option>
                            <option value="email">📧 Email</option>
                          </select>
                        )}
                      />
                      <Controller
                        name={`reminders.${index}.minutes`}
                        control={control}
                        render={({ field: minutesField }) => (
                          <select
                            {...minutesField}
                            onChange={(e) => minutesField.onChange(parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-20"
                            disabled={isLoading}
                          >
                            <option value={0}>At event time</option>
                            <option value={5}>5 minutes before</option>
                            <option value={15}>15 minutes before</option>
                            <option value={30}>30 minutes before</option>
                            <option value={60}>1 hour before</option>
                            <option value={120}>2 hours before</option>
                            <option value={1440}>1 day before</option>
                            <option value={2880}>2 days before</option>
                            <option value={10080}>1 week before</option>
                          </select>
                        )}
                      />
                      {reminderFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReminder(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachments
                </label>

                <div className="space-y-3">
                  {/* File Drop Zone */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag & drop files here, or{' '}
                        <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                          browse
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              // Handle file selection
                              console.log(e.target.files)
                            }}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-6 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <h4 className="flex items-center text-lg font-semibold text-gray-900">
                    <Info className="h-5 w-5 mr-2" />
                    Advanced Options
                  </h4>

                  {/* Color Picker */}
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Palette className="h-4 w-4 mr-2" />
                      Event Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: selectedColor }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      />
                      {showColorPicker && (
                        <div className="flex space-x-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                setSelectedColor(color)
                                setShowColorPicker(false)
                              }}
                              className="w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Lock className="h-4 w-4 mr-2" />
                      Privacy & Visibility
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="p-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">🌍 Public</div>
                            <div className="text-sm text-gray-500">Anyone can see this event</div>
                          </div>
                          <Globe className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      <button
                        type="button"
                        className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">🔒 Private</div>
                            <div className="text-sm text-gray-500">Only you and attendees</div>
                          </div>
                          <Lock className="h-5 w-5 text-blue-500" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/3 border-l border-gray-200 p-6 bg-gray-50">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Event Preview
              </h4>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: selectedColor }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-semibold text-gray-900 flex-1">
                      {watchedTitle || 'Untitled Event'}
                    </h5>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(watchedPriority)}`}>
                      {watchedPriority}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {watchedIsAllDay ? (
                        <>
                          {moment(watchedStart).format('MMM DD, YYYY')}
                          {watchedAllDayType === 'multi-day' && (
                            <> to {moment(watchedEnd).format('MMM DD, YYYY')}</>
                          )}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            All Day
                          </span>
                        </>
                      ) : (
                        moment(watchedStart).format('MMM DD, YYYY @ h:mm A')
                      )}
                    </div>
                    {watchedStart && watchedEnd && (
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2" />
                        {watchedIsAllDay
                          ? `Duration: ${Math.ceil((new Date(watchedEnd) - new Date(watchedStart)) / (1000 * 60 * 60 * 24))} days`
                          : `Duration: ${moment.duration(moment(watchedEnd).diff(moment(watchedStart))).humanize()}`
                        }
                      </div>
                    )}
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      {getCategoryIcon(watchedCategory)} {watchedCategory}
                    </div>
                    {watchedIsRecurring && watchedRecurrence && (
                      <div className="flex items-center">
                        <Repeat className="h-4 w-4 mr-2" />
                        <span className="text-purple-600 font-medium">
                          {getRecurrenceDescription(watchedRecurrence)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Validation Status */}
              <div className="mt-6 p-4 bg-white rounded-lg border">
                <h5 className="font-medium mb-3">Form Status</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Form Valid</span>
                    {isValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Has Changes</span>
                    {isDirty ? (
                      <Check className="h-4 w-4 text-blue-500" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Fields completed: {Object.keys(touchedFields).length}/8
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Action Bar */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {event?.id && (
                <button
                  type="button"
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </button>
              )}
              {event?.id && (
                <button
                  type="button"
                  className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || !isValid}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {event?.id ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}