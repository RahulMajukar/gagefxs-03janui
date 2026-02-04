// src/components/dashboard/GageDrawer.jsx
import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Search,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Package,
  User,
  ArrowLeft,
  AlertTriangle,
  CalendarCheck,
  Building,
  Tag,
  Info,
  MapPin,
  History,
  ShieldCheck,
  TrendingUp,
  Download,
  SortAsc,
  SortDesc
} from 'lucide-react';
import CompleteCalibrationModal from './CompleteCalibrationModal';
import ScheduleCalibrationModal from './ScheduleCalibrationModal';
import InwardModal from './InwardModal';
import Swal from 'sweetalert2';
const GageDrawer = ({
  isOpen,
  onClose,
  filteredGages,
  selectedFilter,
  tableSearch,
  setTableSearch,
  handleScheduleForCalibration,
  handleSendGauge,
  openCompleteCalibration,
  daysUntil,
  onInwardSuccess
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedGage, setSelectedGage] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [selectedGageForInward, setSelectedGageForInward] = useState(null);
  // Calibration history state
  const [calibrationHistory, setCalibrationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'calibrationDate', direction: 'desc' });
  const [mediaFiles, setMediaFiles] = useState({}); // Store media files by history ID
  const [loadingMedia, setLoadingMedia] = useState({}); // Track loading state for each history record
  const handleInwardSubmit = async (formData, fileSummary) => {
    try {
      setIsLoading(true);

      // Use fetch (api was not defined in this component). Use same host pattern as history fetch.
      const response = await fetch(`http://localhost:8080/api/calibration-manager/gages/${selectedGageForInward?.id}/inward`, {
        method: 'POST',
        body: formData
      });

      let resultText = '';
      if (response.ok) {
        const data = await response.json().catch(() => null);
        // Use fileSummary and response data to compose message (prevents unused-variable warnings)
        const totalFiles = (fileSummary?.documents?.length || 0) + (fileSummary?.images?.length || 0) + (fileSummary?.videos?.length || 0);
        resultText = `Inward processed successfully with ${totalFiles} file(s).`;
        if (data && data.message) resultText += ` ${data.message}`;
        Swal.fire({
          title: "Success!",
          text: resultText,
          icon: "success",
        });

        setShowInwardModal(false);

        // Create calendar event for inward (best-effort)
        try {
          const eventPayload = {
            title: `calibration: Inward - ${selectedGageForInward?.serialNumber || selectedGageForInward?.modelNumber || 'Unknown Gage'}`,
            description: "",
            start: fileSummary?.inwardDate ? new Date(fileSummary.inwardDate).toISOString() : new Date().toISOString(),
            end: fileSummary?.inwardDate ? new Date(new Date(fileSummary.inwardDate).getTime() + 60 * 60 * 1000).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            gageName: selectedGageForInward?.name || '',
            category: "inward",
            priority: "medium",
            location: selectedGageForInward?.location || "HF4",
            attendees: [],
            reminders: [
              {
                type: "popup",
                minutes: 15
              }
            ],
            isAllDay: false,
            allDayType: "single-day",
            isRecurring: false,
            recurrence: null,
            color: "#22c55e", // Green for inward
            username: localStorage.getItem("username") || "marsh"
          };

          const calendarResponse = await fetch('http://localhost:8080/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
          });

          if (!calendarResponse.ok) {
            throw new Error(await calendarResponse.text().catch(() => `Status ${calendarResponse.status}`));
          }

          console.log('Calendar event created successfully after inward');
        } catch (err) {
          console.error('Failed to create calendar event after inward:', err);
        }

        // Do not call loadGages() here (undefined). Parent can refresh if needed.
      } else {
        const errText = await response.text().catch(() => 'Unknown error');
        Swal.fire({
          title: "Error",
          text: `Failed to process inward: ${errText}`,
          icon: "error",
        });
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      Swal.fire({
        title: "Error",
        text: `Failed to process inward: ${msg}`,
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the inward button click handler in the list view
  const handleInwardClick = (gage) => {
    setSelectedGageForInward(gage);
    setShowInwardModal(true);
  };
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('GageDrawer opened with filteredGages:', filteredGages);
      console.log('Selected filter:', selectedFilter);
      console.log('Table search:', tableSearch);
    }
  }, [isOpen, filteredGages, selectedFilter, tableSearch]);

  // Handle view transitions
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, isOpen]);

  // Reset selected gage when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGage(null);
      setViewMode('list');
      setError(null);
      setCalibrationHistory([]);
      setHistoryError(null);
    }
  }, [isOpen]);

  const getFileTypeIcon = (mimeType, fileType) => {
    if (fileType === 'document' || mimeType?.includes('pdf') || mimeType?.includes('word')) {
      return '📄';
    }
    if (fileType === 'image' || mimeType?.includes('image')) {
      return '🖼️';
    }
    if (fileType === 'video' || mimeType?.includes('video')) {
      return '🎥';
    }
    return '📎';
  };
  const fetchMediaFiles = async (historyId) => {
    try {
      setLoadingMedia(prev => ({ ...prev, [historyId]: true }));

      const response = await fetch(`http://localhost:8080/api/calibration-manager/history/${historyId}/media`);

      if (!response.ok) {
        throw new Error(`Failed to fetch media files: ${response.status}`);
      }

      const mediaData = await response.json();
      setMediaFiles(prev => ({ ...prev, [historyId]: mediaData }));

      return mediaData;
    } catch (err) {
      console.error('Error fetching media files:', err);
      return [];
    } finally {
      setLoadingMedia(prev => ({ ...prev, [historyId]: false }));
    }
  };

  // --- NEW: Calendar helpers ---
  const buildCalendarEvent = (formData = {}, gage = {}, type = 'Scheduled') => {
    // Attempt to extract start/end from common field names
    const extractISO = (val) => {
      if (!val) return null;
      // If it's already an ISO-looking string, return as-is (Date will parse)
      if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d)) return d.toISOString();
      }
      return null;
    };

    let startIso = extractISO(formData.start || formData.startDate || formData.date || formData.scheduledDate || formData.inwardDate || formData.calibrationDate || gage.dueDate);
    let endIso = extractISO(formData.end || formData.endDate || formData.to || formData.endTime);

    // If only start exists, default to 1 hour duration
    if (startIso && !endIso) {
      const s = new Date(startIso);
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      endIso = e.toISOString();
    }

    // If no dates found, default to "now" + 1 hour
    if (!startIso) {
      const s = new Date();
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      startIso = s.toISOString();
      endIso = e.toISOString();
    }

    // Detect all-day if form indicates it or if times are midnight boundaries
    const isAllDay = !!formData.isAllDay || !!formData.allDay;

    const titlePrefix = type === 'Inward' ? 'calibration: Inward' : 'calibration: Scheduled';
    const title = `${titlePrefix} - ${gage.name || gage.serialNumber || gage.id || 'Instrument'}`;

    const descriptionParts = [];
    if (formData.notes) descriptionParts.push(formData.notes);
    if (gage.notes) descriptionParts.push(`Gage notes: ${gage.notes}`);
    const description = descriptionParts.join('\n') || '';

    const priority = (gage.priority || formData.priority || 'medium').toLowerCase();

    return {
      title,
      description,
      start: startIso,
      end: endIso,
      category: formData.category || 'scheduled',
      priority,
      location: formData.location || gage.location || '',
      attendees: formData.attendees || [],
      reminders: formData.reminders || [{ type: 'popup', minutes: 15 }],
      isAllDay,
      allDayType: formData.allDayType || 'single-day',
      isRecurring: false,
      recurrence: null,
      color: formData.color || '#3b82f6',
      username: formData.username || localStorage.getItem('username') || 'calibration.system'
    };
  };

  const createCalendarEvent = async (eventObj) => {
    try {
      const resp = await fetch('http://localhost:8080/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventObj)
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(txt);
      }

      const data = await resp.json().catch(() => null);
      Swal.fire({
        title: 'Calendar Event Created',
        text: 'Event added to calendar successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      return data;
    } catch (err) {
      console.error('Calendar event creation failed:', err);
      Swal.fire({
        title: 'Calendar Error',
        text: `Failed to add event to calendar: ${err.message || err}`,
        icon: 'error'
      });
      return null;
    }
  };
  // --- END NEW ---

  // Add this function to download a single file
  const downloadFile = async (mediaId, fileName) => {
    try {
      //http://localhost:8080/api/calibration-manager/media/1/download
      // http://localhost:8080/api/calibration-manager/media/2/download
      const response = await fetch(`http://localhost:8080/api/calibration-manager/media/${mediaId}/download`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: `Downloaded ${fileName}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error downloading file:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to download file',
        icon: 'error'
      });
    }
  };

  // Add this function to download all attachments for a history record
  const downloadAllAttachments = async (historyId) => {
    try {
      let files = mediaFiles[historyId];

      // If files not loaded yet, fetch them
      if (!files) {
        files = await fetchMediaFiles(historyId);
      }

      if (!files || files.length === 0) {
        Swal.fire({
          title: 'No Attachments',
          text: 'No files available for this calibration record',
          icon: 'info'
        });
        return;
      }

      // Download each file with a small delay to avoid overwhelming the browser
      for (let i = 0; i < files.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500 * i)); // 500ms delay between downloads
        await downloadFile(files[i].id, files[i].fileName);
      }

      Swal.fire({
        title: 'Success!',
        text: `Downloaded ${files.length} file(s)`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error downloading all attachments:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to download attachments',
        icon: 'error'
      });
    }
  };

  // Fetch calibration history when a gage is selected in detail view
  useEffect(() => {
    if (viewMode === 'detail' && selectedGage) {
      fetchCalibrationHistory(selectedGage.id);
    }
  }, [viewMode, selectedGage]);

  // Function to fetch calibration history
  const fetchCalibrationHistory = async (gageId) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const response = await fetch(`http://localhost:8080/api/calibration-manager/gages/${gageId}/history`);

      if (!response.ok) {
        throw new Error(`Failed to fetch calibration history: ${response.status}`);
      }

      const historyData = await response.json();
      setCalibrationHistory(historyData);

    } catch (err) {
      console.error('Error fetching calibration history:', err);
      setHistoryError('Failed to load calibration history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sort calibration history
  const sortedHistory = React.useMemo(() => {
    if (!calibrationHistory.length) return [];

    const sorted = [...calibrationHistory].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'calibrationDate' || sortConfig.key === 'nextDueDate' || sortConfig.key === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [calibrationHistory, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <SortAsc className="h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ?
      <SortAsc className="h-4 w-4" /> :
      <SortDesc className="h-4 w-4" />;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color for history
  const getHistoryStatusColor = (status) => {
    const config = {
      PASSED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    };
    return config[status] || config.SCHEDULED;
  };

  // Get status badge color for gage
  const getStatusBadge = (status) => {
    const config = {
      upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      calibrated: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      'out for calibration': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      'At Lab': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      scheduled: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' }
    };
    return config[(status || 'upcoming').toLowerCase()] || config.upcoming;
  };

  // Priority styling helper
  const getPriorityBadge = (priority) => {
    const config = {
      high: { bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-800', border: 'border-red-200', icon: AlertTriangle },
      medium: { bg: 'bg-gradient-to-r from-amber-50 to-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
      low: { bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle }
    };
    const { bg, text, border, icon: Icon } = config[(priority || 'medium').toLowerCase()] || config.medium;
    return { bg, text, border, Icon };
  };

  const getTitle = () => {
    const titles = {
      total: 'All Instruments',
      onTime: 'On-Time Calibrations',
      outFor: 'Out for Calibration',
      outOf: 'Overdue Instruments',
      dueNext15: 'Due Soon (15 Days)',
      scheduled: 'Scheduled Calibrations'
    };
    return titles[selectedFilter] || 'Calibration Instruments';
  };

  // Helper: whether scheduling is allowed for a given gage or current filter
  const canSchedule = (gage) => {
    if (!gage) return false;
    if (selectedFilter === 'outFor') return false;
    if ((gage.status || '').toLowerCase() === 'out for calibration') return false;
    return true;
  };

  const handleScheduleClick = (gage) => {
    if (!canSchedule(gage)) {
      setError('Scheduling disabled for instruments that are "Out for Calibration".');
      setTimeout(() => setError(null), 3500);
      return;
    }
    setSelectedGage(gage);
    setShowScheduleModal(true);
  };

  const handleCompleteClick = (gage) => {
    setSelectedGage(gage);
    setShowCompleteModal(true);
  };

  const handleGageClick = async (gage) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedGage(gage);
      setViewMode('detail');
    } catch (err) {
      console.error('Error fetching gage details:', err);
      setError('Failed to load instrument details. Please try again.');
      setSelectedGage(gage);
      setViewMode('detail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedGage(null);
    setError(null);
    setCalibrationHistory([]);
    setHistoryError(null);
  };

  const handleScheduleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      console.log('Scheduling calibration for:', selectedGage?.id, formData);
      // Call parent handler (existing behavior)
      await handleScheduleForCalibration?.(selectedGage, formData);

      // Build and send calendar event
      try {
        const eventObj = buildCalendarEvent(formData, selectedGage, 'scheduled');
        console.log('Creating calendar event with data:', eventObj);
        await createCalendarEvent(eventObj);
      } catch (err) {
        console.error('Failed to create calendar event after scheduling:', err);
        // don't block the normal flow - just show non-blocking alert already handled in createCalendarEvent
      }

      setShowScheduleModal(false);
    } catch (err) {
      console.error('Error scheduling calibration:', err);
      setError('Failed to schedule calibration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSubmit = async (formData) => {
    try {
      setIsLoading(true);
      console.log('Completing calibration for:', selectedGage?.id, formData);
      openCompleteCalibration?.(selectedGage, formData);
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Error completing calibration:', err);
      setError('Failed to complete calibration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export calibration history as CSV
  const exportCalibrationHistory = () => {
    if (!calibrationHistory.length) {
      alert('No calibration history to export');
      return;
    }

    const headers = ['Calibration Date', 'Next Due Date', 'Status', 'Performed By', 'Notes', 'Created At'];
    const csvRows = [headers.join(',')];

    calibrationHistory.forEach(record => {
      const row = [
        `"${record.calibrationDate || ''}"`,
        `"${record.nextDueDate || ''}"`,
        `"${record.status || ''}"`,
        `"${record.performedBy || ''}"`,
        `"${(record.notes || '').replace(/"/g, '""')}"`,
        `"${record.createdAt || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calibration-history-${selectedGage?.serialNumber || selectedGage?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="text-center py-20">
      <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <p className="text-red-600 font-medium text-lg mb-2">Error Loading Data</p>
      <p className="text-gray-600 text-sm">{error}</p>
      <button
        onClick={handleBackToList}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Back to List
      </button>
    </div>
  );

  // Render detailed view
  const renderDetailView = () => {
    if (!selectedGage) {
      return (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No instrument selected</p>
          <button
            onClick={handleBackToList}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      );
    }

    if (isLoading) return renderLoading();
    if (error) return renderError();

    const daysUntilDue = selectedGage.dueDate ? daysUntil?.(selectedGage.dueDate) : null;
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const { bg: priorityBg, text: priorityText, border: priorityBorder, Icon: PriorityIcon } = getPriorityBadge(selectedGage.priority);
    const { bg: statusBg, text: statusText, dot: statusDot } = getStatusBadge(selectedGage.status);

    return (
      <div className="p-6 max-w-full mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium group transition-all"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">Back to Instrument List</span>
        </button>

        {/* Hero Header */}
        <div className={`rounded-2xl p-8 mb-8 ${isOverdue ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-200'} border-2 shadow-lg`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-xs font-bold text-indigo-700 border border-indigo-200">
                    {selectedGage.id || 'N/A'}
                  </span>
                  <p className="text-gray-900 font-semibold mt-2">S/N: {selectedGage.serialNumber || 'N/A'}</p>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{selectedGage.name || 'Unnamed Instrument'}</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">{selectedGage.notes || 'No additional notes available.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className={`${priorityBg} ${priorityBorder} px-4 py-2.5 rounded-xl border flex items-center gap-2`}>
                <PriorityIcon className="h-4 w-4" />
                <span className={`font-bold ${priorityText}`}>{(selectedGage.priority || 'medium').toUpperCase()} PRIORITY</span>
              </div>
              <div className={`${statusBg} px-4 py-2.5 rounded-xl flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                <span className={`font-bold ${statusText}`}>{(selectedGage.status || 'unknown').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              {isOverdue && (
                <div className="bg-red-100 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-red-200">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="font-bold text-red-700">OVERDUE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Instrument Details */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Info className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Instrument Details</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Model', value: selectedGage.model, icon: Tag },
                  { label: 'Manufacturer Name', value: selectedGage.gageEntity.manufacturerName, icon: Building },
                  { label: 'Serial Number', value: selectedGage.serialNumber, icon: ShieldCheck },
                  { label: 'Gage Type', value: selectedGage.gageEntity.gageType.name, icon: TrendingUp },
                  { label: 'Location', value: selectedGage.location, icon: MapPin }
                ].map(({ label, value, icon: Icon }, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-gray-100 rounded-lg">
                      <Icon className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="font-medium text-gray-900">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <History className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Calibration History</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCalibrationHistory}
                    disabled={!calibrationHistory.length}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                  <span className="text-sm text-gray-500">
                    {calibrationHistory.length} record{calibrationHistory.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">{historyError}</p>
                  <button
                    onClick={() => fetchCalibrationHistory(selectedGage.id)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : calibrationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No calibration history available</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort('calibrationDate')}
                        >
                          <div className="flex items-center gap-1">
                            Calibration Date
                            {getSortIcon('calibrationDate')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort('nextDueDate')}
                        >
                          <div className="flex items-center gap-1">
                            Next Due Date
                            {getSortIcon('nextDueDate')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                          Performed By
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                          Attachments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedHistory.map((record) => {
                        const statusColors = getHistoryStatusColor(record.status);
                        const files = mediaFiles[record.id] || [];
                        const isLoadingFiles = loadingMedia[record.id] || false;

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {formatDate(record.calibrationDate)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {formatDate(record.nextDueDate)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border} whitespace-nowrap`}>
                                {record.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {record.performedBy || '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={record.notes}>
                              {record.notes || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                {isLoadingFiles ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                ) : files.length > 0 ? (
                                  <>
                                    {/* Download All Button */}
                                    <button
                                      onClick={() => downloadAllAttachments(record.id)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                                      title={`Download all ${files.length} file(s)`}
                                    >
                                      <Download className="h-3 w-3" />
                                      All ({files.length})
                                    </button>

                                    {/* Individual Files Dropdown */}
                                    <div className="relative group">
                                      <button
                                        onClick={() => {
                                          if (!files || files.length === 0) {
                                            fetchMediaFiles(record.id);
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                        title="View files"
                                      >
                                        📎 {files.length}
                                      </button>

                                      {/* Dropdown menu */}
                                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <div className="p-2 max-h-48 overflow-y-auto">
                                          <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">
                                            Attached Files
                                          </div>
                                          {files.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() => downloadFile(file.id, file.fileName)}
                                              className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-gray-50 rounded transition-colors text-xs"
                                            >
                                              <span className="text-lg">{getFileTypeIcon(file.mimeType, file.fileType)}</span>
                                              <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium text-gray-900">
                                                  {file.fileName}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                  {file.fileType}
                                                </div>
                                              </div>
                                              <Download className="h-3 w-3 text-gray-400" />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => fetchMediaFiles(record.id)}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Check for attachments"
                                  >
                                    Check Files
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Calibration Status */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Calibration Status</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Last Calibrated</p>
                  <p className="font-medium text-gray-900">{selectedGage.lastCalibrated || 'Never'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Due Date</p>
                  <p className={`font-bold ${isOverdue ? 'text-red-600' : daysUntilDue <= 15 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {selectedGage.dueDate || 'Not scheduled'}
                  </p>
                </div>
                {daysUntilDue !== null && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Time Remaining</p>
                    <p className={`font-bold ${isOverdue ? 'text-red-600' : daysUntilDue <= 7 ? 'text-red-600' : daysUntilDue <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} remaining`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Assigned To</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Responsible Technician</p>
                  <p className="font-medium text-gray-900">{selectedGage.responsible || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Department</p>
                  <p className="font-medium text-gray-900">{selectedGage.department || '—'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {/* <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleScheduleClick(selectedGage)}
                  disabled={isLoading || !canSchedule(selectedGage)}
                  aria-disabled={isLoading || !canSchedule(selectedGage)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${canSchedule(selectedGage)
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                    : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  <Calendar className="h-4 w-4" />
                  {isLoading ? 'Scheduling...' : (canSchedule(selectedGage) ? 'Schedule Calibration' : 'Scheduling Disabled')}
                </button>
                <button
                  onClick={() => handleCompleteClick(selectedGage)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isLoading ? 'Completing...' : 'Complete Calibration'}
                </button>
              </div>
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  // Check if we have any gages to display
  const hasGages = filteredGages && filteredGages.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-4/5 lg:w-3/4 xl:w-2/3 bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {viewMode === 'detail' ? (
                  <button
                    onClick={handleBackToList}
                    className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {viewMode === 'detail' ? 'Instrument Details' : getTitle()}
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1 opacity-90">
                    {viewMode === 'list'
                      ? `${hasGages ? filteredGages.length : 0} instrument${hasGages && filteredGages.length === 1 ? '' : 's'} found`
                      : selectedGage?.name || 'Viewing details'}
                  </p>
                </div>
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-200 h-5 w-5" />
                <input
                  value={tableSearch || ''}
                  onChange={(e) => setTableSearch?.(e.target.value)}
                  placeholder="Search by ID, name, model, or technician..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white/15 backdrop-blur-sm border-2 border-white/25 rounded-xl text-white placeholder-indigo-200 focus:bg-white/25 focus:border-white/40 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-auto transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {viewMode === 'list' ? (
              <div className="p-6">
                {!hasGages ? (
                  <div className="text-center py-20">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No instruments found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {filteredGages === undefined ? 'Loading instruments...' : 'Try adjusting your filters or search terms'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredGages.map((g) => {
                      const daysUntilDue = g.dueDate ? daysUntil?.(g.dueDate) : null;
                      const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                      const { bg: priorityBg, text: priorityText, border: priorityBorder } = getPriorityBadge(g.priority);
                      const { bg: statusBg, text: statusText, dot: statusDot } = getStatusBadge(g.status);

                      // Format time remaining for upcoming status
                      let timeRemainingText = '';
                      if (g.status === 'upcoming' && daysUntilDue !== null) {
                        if (isOverdue) {
                          timeRemainingText = `${Math.abs(daysUntilDue)} days overdue`;
                        } else {
                          timeRemainingText = `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} remaining`;
                        }
                      }

                      return (
                        <div
                          key={g.id}
                          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                          onClick={() => handleGageClick(g)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-indigo-600 text-lg">{g.id}</span>
                                <span className="text-gray-500">•</span>
                                <span className="font-semibold text-gray-900 truncate">{g.name}</span>
                              </div>
                              <p className="text-gray-600 text-sm mb-1">{g.serialNumber || 'No serial number'}</p>
                              <p className="text-gray-600 text-sm mb-3">{g.model || g.manufacturer || '—'}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className={`${priorityBg} ${priorityBorder} px-3 py-1 rounded-full text-xs font-bold ${priorityText} border`}>
                                  {(g.priority || 'medium').toUpperCase()}
                                </span>
                                <span className={`${statusBg} px-3 py-1 rounded-full text-xs font-bold ${statusText} flex items-center gap-1`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
                                  {g.status || 'unknown'}
                                </span>
                                {timeRemainingText && (
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                                    {timeRemainingText}
                                  </span>
                                )}
                                {isOverdue && g.status !== 'overdue' && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Due Date</p>
                                <p className={`font-medium ${isOverdue ? 'text-red-600' : daysUntilDue <= 15 ? 'text-amber-600' : 'text-gray-900'}`}>
                                  {g.dueDate || '—'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {selectedFilter === 'outFor' ? (
                                  <button
                                    title="Process Inward"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInwardClick(g);
                                    }}
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    <ArrowLeft className="h-5 w-5" />
                                    Inward
                                  </button>
                                ) : selectedFilter === 'scheduled' ? (
                                  // Show Send Gauge button for scheduled items
                                  <button
                                    title="Send Gauge"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendGauge?.(g);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    Send Gauge
                                  </button>
                                ) : (
                                  // Show regular Schedule/Complete buttons for other views
                                  <>
                                    {canSchedule(g) && (
                                      <button
                                        title="Schedule Calibration"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleScheduleClick(g);
                                        }}
                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                      >
                                        <Calendar className="h-5 w-5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              renderDetailView()
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {canSchedule(selectedGage) && (
        <ScheduleCalibrationModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          selectedGage={selectedGage}
          onSubmit={handleScheduleSubmit}
          isLoading={isLoading}
        />
      )}

      <CompleteCalibrationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        selectedGage={selectedGage}
        onSubmit={handleCompleteSubmit}
        isLoading={isLoading}
      />

      <InwardModal
        isOpen={showInwardModal}
        onClose={() => setShowInwardModal(false)}
        selectedGage={selectedGageForInward}
        onSubmit={handleInwardSubmit}
        onSuccess={onInwardSuccess}
        isLoading={isLoading}
      />
    </>
  );
};

export default GageDrawer;