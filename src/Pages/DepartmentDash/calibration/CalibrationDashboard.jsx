// src/Pages/DepartmentDash/calibration/CalibrationDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import calendarAPI from '../../../Components/calendar/calendarAPI';

// Components
import Header from './Header';
import SummaryCards from './SummaryCards';
import CalibrationTabs from './CalibrationTabs';
import SidebarStats from './SidebarStats';
import AddGaugeModal from './AddGaugeModalDelete';
import CompleteCalibrationModal from './CompleteCalibrationModal';
import GaugeDrawer from './GaugeDrawer';
import Swal from 'sweetalert2';

// --------------------- useForm ---------------------
const useForm = (defaultValues = {}) => {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const register = (name, validation = {}) => ({
    name,
    value: values[name] || '',
    onChange: (e) => {
      const value = e.target.value;
      setValues(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    },
    onBlur: () => {
      setTouched(prev => ({ ...prev, [name]: true }));
      validateField(name, values[name], validation);
    }
  });
  const validateField = (name, value, validation) => {
    let error = null;
    if (validation.required && (!value || value.trim() === '')) {
      error = `${name} is required`;
    } else if (validation.minLength && value && value.length < validation.minLength) {
      error = `${name} must be at least ${validation.minLength} characters`;
    } else if (validation.pattern && value && !validation.pattern.test(value)) {
      error = validation.message || `Invalid ${name} format`;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };
  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault();
    let isValid = true;
    const newErrors = {};
    Object.keys(values).forEach(fieldName => {
      const fieldValue = values[fieldName];
      if (!fieldValue && ['gaugeName', 'gaugeId', 'manufacturer', 'model', 'serialNumber', 'department', 'location', 'responsible'].includes(fieldName)) {
        newErrors[fieldName] = `${fieldName} is required`;
        isValid = false;
      }
    });
    if (values.gaugeId && !/^[A-Z]{2,3}-\d{3,6}$/.test(values.gaugeId)) {
      newErrors.gaugeId = 'Format: ABC-123456';
      isValid = false;
    }
    setErrors(newErrors);
    if (isValid) onSubmit(values);
  };
  const reset = () => {
    setValues(defaultValues);
    setErrors({});
    setTouched({});
  };
  return {
    register,
    handleSubmit,
    formState: { errors, touched },
    reset,
    watch: (name) => values[name],
    setValue: (name, value) => setValues(prev => ({ ...prev, [name]: value }))
  };
};

// --------------------- CalibrationSummaryCard ---------------------
// const CalibrationSummaryCard = ({ calibrationEvents, loading }) => {
//   if (loading) {
//     return (
//       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibration Events</h3>
//         <p className="text-gray-500">Loading calibration events...</p>
//       </div>
//     );
//   }

//   if (!calibrationEvents || calibrationEvents.length === 0) {
//     return (
//       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibration Events</h3>
//         <p className="text-gray-500">No calibration events scheduled</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//       <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibrated Details Card</h3>
//       <div className="space-y-4">
//         {calibrationEvents.slice(0, 5).map((event) => (
//           <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h4 className="font-medium text-gray-900">{event.title}</h4>
//                 <p className="text-sm text-gray-600 mt-1">{event.description}</p>
//                 <div className="flex items-center mt-2 text-sm text-gray-500">
//                   <span className="mr-4">
//                     📍 {event.location || 'No location specified'}
//                   </span>
//                   <span>
//                     ⏰ {new Date(event.start).toLocaleDateString()} •{' '}
//                     {new Date(event.start).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })} - {new Date(event.end).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
//               </div>
//               <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.priority === 'high'
//                 ? 'bg-red-100 text-red-800'
//                 : event.priority === 'medium'
//                   ? 'bg-yellow-100 text-yellow-800'
//                   : 'bg-green-100 text-green-800'
//                 }`}>
//                 {event.priority} priority
//               </span>
//             </div>
//             {event.attendees && event.attendees.length > 0 && (
//               <div className="mt-2">
//                 <span className="text-sm text-gray-500">Attendees: </span>
//                 {event.attendees.map((attendee, index) => (
//                   <span key={attendee.id} className="text-sm text-gray-600">
//                     {attendee.name || attendee.username}
//                     {index < event.attendees.length - 1 ? ', ' : ''}
//                   </span>
//                 ))}
//               </div>
//             )}
//             {event.reminders && event.reminders.length > 0 && (
//               <div className="mt-1">
//                 <span className="text-sm text-gray-500">Reminder: </span>
//                 <span className="text-sm text-gray-600">
//                   {event.reminders[0].minutes} minutes before ({event.reminders[0].type})
//                 </span>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
// --------------------- CalibrationSummaryCard ---------------------
const CalibrationSummaryCard = ({ calibrationEvents, loading }) => {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibration Events</h3>
        <p className="text-gray-500">Loading calibration events...</p>
      </div>
    );
  }

  if (!calibrationEvents || calibrationEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibration Events</h3>
        <p className="text-gray-500">No calibration events scheduled</p>
      </div>
    );
  }

  // Determine visible events
  const visibleEvents = showAll
    ? calibrationEvents
    : calibrationEvents.slice(0, 3);

  const hasMore = calibrationEvents.length > 3;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibrated Details Card</h3>
      <div className="space-y-4">
        {visibleEvents.map((event) => (
          <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span className="mr-4">
                    📍 {event.location || 'No location specified'}
                  </span>
                  <span>
                    ⏰ {new Date(event.start).toLocaleDateString()} •{' '}
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(event.end).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.priority === 'high'
                ? 'bg-red-100 text-red-800'
                : event.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
                }`}>
                {event.priority} priority
              </span>
            </div>
            {event.attendees && event.attendees.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">Attendees: </span>
                {event.attendees.map((attendee, index) => (
                  <span key={attendee.id} className="text-sm text-gray-600">
                    {attendee.name || attendee.username}
                    {index < event.attendees.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            {event.reminders && event.reminders.length > 0 && (
              <div className="mt-1">
                <span className="text-sm text-gray-500">Reminder: </span>
                <span className="text-sm text-gray-600">
                  {event.reminders[0].minutes} minutes before ({event.reminders[0].type})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center mx-auto"
          >
            {showAll ? 'Show Less' : `Show ${calibrationEvents.length - 3} More`}
          </button>
        </div>
      )}
    </div>
  );
};

// --------------------- API ---------------------
const CALIBRATION_BASE = '/calibration-manager';

const GageApi = {
  getAll: () => api.get('/gages'),
  completeCalibration: (gageId, data) =>
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/complete`, data),
  scheduleForCalibration: (gageId, payload) =>
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/schedule`, payload),
  sendGauge: (gageId) =>
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/send`),
  inwardGauge: (gageId) =>
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/inward`),
  getCalibrationHistory: (gageId) =>
    api.get(`${CALIBRATION_BASE}/gages/${gageId}/history`),
};

// --------------------- Main ---------------------
const CalibrationDashboard = () => {
  const [gages, setGages] = useState([]);
  const [calibrationEvents, setCalibrationEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddGaugeModal, setShowAddGaugeModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [selectedGageForCalibration, setSelectedGageForCalibration] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('total');
  const [tableSearch, setTableSearch] = useState('');
  const [calibrationHistoryCount, setCalibrationHistoryCount] = useState(0);

  // Static data
  const departments = ['Production', 'QC', 'R&D', 'Electronics', 'Mechanical', 'Laboratory'];
  const priorities = [
    { value: 'high', label: 'High Priority', color: 'text-red-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'low', label: 'Low Priority', color: 'text-green-600' }
  ];
  const intervals = ['1', '3', '6', '12', '24', '36'];

  // Fetch
  useEffect(() => {
    loadGages();
    fetchCalibrationHistoryCount();
    loadCalibrationEvents();
  }, []);

  const loadGages = async () => {
    try {
      setLoading(true);
      const res = await GageApi.getAll();
      setGages(res.data || []);
    } catch (err) {
      console.error('Failed to load gages', err);
      alert('Failed to load gages from server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch calibration events from calendar API
  // const loadCalibrationEvents = async () => {
  //   try {
  //     setEventsLoading(true);
  //     const res = await api.get('http://localhost:8080/api/calendar/events');
  //     const events = res.data || [];

  //     // Filter events where title starts with "Calibration"
  //     const calibrationEvents = events.filter(event =>
  //       event.title && event.title.startsWith('Calibration')
  //     );

  //     setCalibrationEvents(calibrationEvents);
  //   } catch (err) {
  //     console.error('Failed to load calibration events', err);
  //     // Set empty array on error
  //     setCalibrationEvents([]);
  //   } finally {
  //     setEventsLoading(false);
  //   }
  // };

  const loadCalibrationEvents = async () => {
    try {
      setEventsLoading(true);

      // Ensure we have a user email before calling the calendar service
      const userEmail = calendarAPI.getUserEmail();
      if (!userEmail) {
        console.warn('⚠️ No user email found in storage; skipping calendar events fetch');
        setCalibrationEvents([]);
        return;
      }

      // Reuse shared calendar API (handles base URL + headers + date parsing)
      const events = await calendarAPI.getUserEvents();

      // Filter calibration events
      const calibrationEvents = events.filter(
        (event) => event.title && event.title.startsWith('calibration')
      );

      setCalibrationEvents(calibrationEvents);
    } catch (err) {
      console.error('Failed to load calibration events', err);
      setCalibrationEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch calibration history count for "Calibrated On Time"
  const fetchCalibrationHistoryCount = async () => {
    try {
      const res = await api.get(`${CALIBRATION_BASE}/history`);
      if (res.data && Array.isArray(res.data)) {
        // Get unique calibration records count
        const uniqueCalibrations = res.data.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setCalibrationHistoryCount(uniqueCalibrations.length);
      }
    } catch (err) {
      console.error('Failed to fetch calibration history', err);
    }
  };

  // Formatting: Map API status to UI status & source
  const formatGageForUI = (gage) => {
    const today = new Date();
    const nextCalDate = gage.nextCalibrationDate ? new Date(gage.nextCalibrationDate) : null;

    let uiStatus = 'upcoming';
    let source = 'upcoming';

    // Handle explicit API statuses first
    if (gage.status === 'SCHEDULED') {
      uiStatus = 'scheduled';
      source = 'scheduled';
    } else if (
      gage.status === 'OUT_FOR_CALIBRATION' ||
      gage.status === 'OUT_OF_STORE' ||
      gage.status === 'ISSUED'
    ) {
      uiStatus = 'At Lab';
      source = 'outFor';
    } else if (nextCalDate && nextCalDate < today) {
      uiStatus = 'outOfCalibration';
      source = 'outOf';
    } else if (nextCalDate && nextCalDate <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)) {
      uiStatus = 'due';
    }

    return {
      id: gage.id,
      name: gage.name || gage.serialNumber || gage.modelNumber || 'Unnamed',
      serialNumber: gage.serialNumber,
      model: gage.modelNumber,
      manufacturer: gage.manufacturer?.name || null,
      department: gage.department || 'Unknown',
      location: gage.location,
      lastCalibrated: gage.calibrationHistory?.[0]?.calibrationDate || null,
      dueDate: gage.nextCalibrationDate,
      responsible: gage.assignedTo || 'Unassigned',
      priority: gage.criticality?.toLowerCase() || 'medium',
      status: uiStatus,
      source,
      gageEntity: gage
    };
  };

  const allGauges = useMemo(() => gages.map(formatGageForUI), [gages]);

  const calculateDueNext15Days = (gauges) => {
    const today = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);
    return gauges.filter(g => {
      if (!g.dueDate) return false;
      const dueDate = new Date(g.dueDate);
      return dueDate >= today && dueDate <= fifteenDaysFromNow;
    }).length;
  };

  const handleInward = async (gageUI) => {
    try {
      await GageApi.inwardGauge(gageUI.id);
      // alert('✅ Gage inward processed successfully!');
      Swal.fire({
        title: "Good job!",
        text: "Gage inward processed successfully!",
        icon: "success"
      });
      loadGages();
    } catch (err) {
      console.error('Inward failed', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      // alert(`❌ Failed to process inward: ${msg}`);
    }
  };

  // const handleInward = async (gageUI) => {
  //   try {
  //     // 1. Inward API
  //     await GageApi.inwardGauge(gageUI.id);

  //     // 2. Prepare event data
  //     const startDate = new Date(); // inward date
  //     const endDate = new Date();
  //     endDate.setHours(endDate.getHours() + 1); // 1-hour event (adjust if needed)

  //     const eventData = {
  //       title: `${gageUI.gageTypeName || "Gage"} Inward`,
  //       description: `Inward completed for ${gageUI.modelNumber || "Gage"} (SN: ${gageUI.serialNumber})`,
  //       start: startDate.toISOString(),
  //       end: endDate.toISOString(),
  //       category: "Inward",
  //       priority: CRITICALITY_PRIORITY_MAP[gageUI.criticality] || "medium",
  //       location: gageUI.location || "",
  //       gageName: gageUI.gageName,
  //       attendees: ["calibration.system", "planthod.system"],
  //       reminders: [{ type: "popup", minutes: 15 }],
  //       isAllDay: false,
  //       allDayType: "single-day",
  //       isRecurring: false,
  //       recurrence: null,
  //       color: "#22c55e", // green for inward
  //       username: localStorage.getItem("username") || "itadmin.system"
  //     };

  //     // 3. Call event API
  //     await api.post("/calendar/events", eventData);

  //     // 4. Success UI
  //     Swal.fire({
  //       title: "Good job!",
  //       text: "Gage inward processed and event created successfully!",
  //       icon: "success"
  //     });

  //     loadGages();
  //   } catch (err) {
  //     console.error("Inward failed", err);
  //     const msg = err.response?.data?.message || err.message || "Unknown error";

  //     Swal.fire({
  //       title: "Error",
  //       text: `Failed to process inward: ${msg}`,
  //       icon: "error"
  //     });
  //   }
  // };


  const summaryData = useMemo(() => {
    const totalGages = allGauges.length;

    // Use calibration history count for calibrated on time
    const calibratedOnTime = calibrationHistoryCount;

    const outForCalibration = allGauges.filter(g => g.source === 'outFor').length;

    const outOfCalibration = allGauges.filter(g => g.source === 'outOf' || g.status === 'outOfCalibration').length;

    const dueNext15Days = calculateDueNext15Days(allGauges);

    // Count scheduled gages based on SCHEDULED status
    const scheduledGages = allGauges.filter(g => g.source === 'scheduled').length;

    return {
      totalGages,
      calibratedOnTime,
      outForCalibration,
      outOfCalibration,
      dueNext15Days,
      scheduledGages
    };
  }, [allGauges, calibrationHistoryCount]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
      case 'outOfCalibration': return 'text-red-600 bg-red-100';
      case 'due': return 'text-orange-600 bg-orange-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'At Lab': return 'text-purple-600 bg-purple-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      case 'In Transit': return 'text-blue-600 bg-blue-100';
      case 'Awaiting Report': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const openDrawer = (filterKey) => {
    setSelectedFilter(filterKey);
    setTableSearch('');
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedFilter('total');
  };

  const parseDate = (d) => {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed) ? null : parsed;
  };

  const daysUntil = (d) => {
    const date = parseDate(d);
    if (!date) return null;
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredGauges = useMemo(() => {
    let list = [...allGauges];
    switch (selectedFilter) {
      case 'total':
        break;
      case 'onTime':
        list = list.filter(g => g.status !== 'outOfCalibration' && g.source !== 'outFor' && g.source !== 'outOf');
        break;
      case 'outFor':
        list = list.filter(g => g.source === 'outFor');
        break;
      case 'outOf':
        list = list.filter(g => g.source === 'outOf' || g.status === 'outOfCalibration');
        break;
      case 'dueNext15':
        const today = new Date();
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(today.getDate() + 15);
        list = list.filter(g => {
          if (!g.dueDate) return false;
          const dueDate = new Date(g.dueDate);
          return dueDate >= today && dueDate <= fifteenDaysFromNow;
        });
        break;
      case 'scheduled':
        list = list.filter(g => g.source === 'scheduled');
        break;
      default:
        break;
    }
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter(g =>
        (g.id && g.id.toString().toLowerCase().includes(q)) ||
        (g.name && g.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allGauges, selectedFilter, tableSearch]);

  // --------------------- Modals ---------------------
  const addGaugeForm = useForm({
    gaugeName: '',
    gaugeId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    department: '',
    location: '',
    calibrationInterval: '12',
    lastCalibrationDate: '',
    nextDueDate: '',
    responsible: '',
    priority: 'medium',
    calibrationStandard: '',
    notes: ''
  });

  const onSubmitGauge = (data) => {
    alert('Schedule Gage API not implemented yet. This is a frontend-only demo.');
    addGaugeForm.reset();
    setShowAddGaugeModal(false);
  };

  const calForm = useForm({ performedBy: '', notes: '' });

  const handleCompleteCalibration = async (data) => {
    try {
      await GageApi.completeCalibration(selectedGageForCalibration.id, {
        performedBy: data.performedBy || 'Lab Technician',
        notes: data.notes
      });
      alert('✅ Calibration completed successfully!');
      setShowCalibrationModal(false);
      calForm.reset();
      loadGages();
      fetchCalibrationHistoryCount();
    } catch (err) {
      console.error('Calibration failed', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      alert(`❌ Failed to complete calibration: ${msg}`);
    }
  };

  const openCompleteCalibration = (gageUI) => {
    setSelectedGageForCalibration(gageUI);
    calForm.reset({ performedBy: '', notes: '' });
    setShowCalibrationModal(true);
  };

  const handleScheduleForCalibration = async (gageUI, formData) => {
    // This function is called from ScheduleCalibrationModal after successful API call
    // Just show success message and reload
    // alert('✅ Calibration scheduled successfully!');
    Swal.fire({
      title: "Good job!",
      text: "Calibration scheduled successfully!",
      icon: "success"
    });
    await loadGages();
  };

  const handleSendGauge = async (gageUI) => {
    try {
      await GageApi.sendGauge(gageUI.id);
      // alert('✅ Gage sent successfully!');
      Swal.fire({
        title: "Good job!",
        text: "Gage sent successfully!",
        icon: "success"
      });
      loadGages();
    } catch (err) {
      console.error('Send gauge failed', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      alert(`❌ Failed to send gauge: ${msg}`);
    }
  };

  const deleteGauge = (id) => {
    if (!window.confirm('Delete this gauge?')) return;
    alert('Delete not implemented yet');
  };

  const exportCSV = (rows) => {
    if (!rows?.length) {
      alert('No rows to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Model', 'Manufacturer', 'LastCalibrated', 'DueDate', 'Responsible', 'Priority', 'Status', 'Source'];
    const csvRows = [headers.join(',')];
    rows.forEach(r => {
      const row = [
        `"${r.id || ''}"`,
        `"${r.name || ''}"`,
        `"${r.model || ''}"`,
        `"${r.manufacturer || ''}"`,
        `"${r.lastCalibrated || ''}"`,
        `"${r.dueDate || ''}"`,
        `"${r.responsible || ''}"`,
        `"${r.priority || ''}"`,
        `"${r.status || ''}"`,
        `"${r.source || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gauges_${selectedFilter || 'list'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading gages from server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calibration Summary Card */}
        <CalibrationSummaryCard
          calibrationEvents={calibrationEvents}
          loading={eventsLoading}
        />

        <SummaryCards
          summaryData={summaryData}
          allGauges={allGauges}
          openDrawer={openDrawer}
          handleScheduleForCalibration={handleScheduleForCalibration}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CalibrationTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              allGauges={allGauges}
              handleScheduleForCalibration={handleScheduleForCalibration}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </div>

          <SidebarStats allGauges={allGauges} summaryData={summaryData} />
        </div>

        <AddGaugeModal
          isOpen={showAddGaugeModal}
          onClose={() => {
            setShowAddGaugeModal(false);
            addGaugeForm.reset();
          }}
          onSubmit={onSubmitGauge}
          register={addGaugeForm.register}
          handleSubmit={addGaugeForm.handleSubmit}
          errors={addGaugeForm.formState.errors}
          reset={addGaugeForm.reset}
          departments={departments}
          priorities={priorities}
          intervals={intervals}
        />

        <CompleteCalibrationModal
          isOpen={showCalibrationModal}
          onClose={() => setShowCalibrationModal(false)}
          onSubmit={handleCompleteCalibration}
          register={calForm.register}
          handleSubmit={calForm.handleSubmit}
          errors={calForm.formState.errors}
          selectedGage={selectedGageForCalibration}
        />

        <GaugeDrawer
          isOpen={showDrawer}
          onClose={closeDrawer}
          filteredGages={filteredGauges}
          selectedFilter={selectedFilter}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
          exportCSV={exportCSV}
          handleScheduleForCalibration={handleScheduleForCalibration}
          handleSendGauge={handleSendGauge}
          openCompleteCalibration={openCompleteCalibration}
          deleteGauge={deleteGauge}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          daysUntil={daysUntil}
          handleInward={handleInward}
          onInwardSuccess={loadGages}
        />
      </div>
    </div>
  );
};

export default CalibrationDashboard;
