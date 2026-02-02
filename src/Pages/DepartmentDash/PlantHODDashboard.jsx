import React, { useState, useEffect } from 'react';
import api from "../../api/axios";
import Modal from "../../Components/Modal";
import ReallocationManagementModal from "../../Components/ReallocationManagementModal";
import {
  getUsers,
  countPendingApprovals,
  sendMail,
  getReallocatesByTimeLimit,
  getReallocateTimeLimits,
  processExpiredReallocation,
  updateGageIssueAllocation
} from "../../api/api";

const PlantHODDashboard = () => {
  const [activeGages, setActiveGages] = useState([]);
  const [issueGages, setIssueGages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedGage, setSelectedGage] = useState(null);
  const [showGageDetails, setShowGageDetails] = useState(false);
  const [loadingGageDetails, setLoadingGageDetails] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [availableOperations, setAvailableOperations] = useState([]);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [modalGage, setModalGage] = useState(null);
  const [showReallocationModal, setShowReallocationModal] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [hodTimeLimit, setHodTimeLimit] = useState('ONE_DAY');
  const [hodMessage, setHodMessage] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestDisabled, setRequestDisabled] = useState(false);
  const [showRequestEmailModal, setShowRequestEmailModal] = useState(false);
  const [availableGmails, setAvailableGmails] = useState([]);
  const [requestSubject, setRequestSubject] = useState('Request Gage Reallocation');
  const [requestBody, setRequestBody] = useState('Please consider my gage reallocation request.');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('GageFX Mail');
  const [sendMessage, setSendMessage] = useState('Message from Plant HOD Dashboard');
  const [sendLoading, setSendLoading] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showTimeLimitedModal, setShowTimeLimitedModal] = useState(false);
  const [timeLimitedReallocations, setTimeLimitedReallocations] = useState([]);
  const [availableTimeLimits, setAvailableTimeLimits] = useState([]);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState('ALL');
  const [countdowns, setCountdowns] = useState({});
  const [processingExpiredMap, setProcessingExpiredMap] = useState({});
  const [showChangeOperatorModal, setShowChangeOperatorModal] = useState(false);
  const [selectedIssueForChange, setSelectedIssueForChange] = useState(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [newFunction, setNewFunction] = useState('');
  const [newOperation, setNewOperation] = useState('');
  const [recentTimeLimited, setRecentTimeLimited] = useState([]);

  // Determine current user's role
  const storedUser = localStorage.getItem("user");
  const currentUserRole = storedUser ? JSON.parse(storedUser).role : null;

  // ... [rest of helper functions unchanged: updateCountdownsNow, formatExpiresIn, getProgressBarStyles, getTotalDurationMs, etc.] ...

  // Compute countdowns immediately for current list
  const updateCountdownsNow = (items = timeLimitedReallocations) => {
    const now = new Date().getTime();
    const newCountdowns = {};
    (items || []).forEach((item) => {
      if (item.status !== 'APPROVED' || !item.timeLimit) return;
      const expiry = new Date(item.expiresAt || item.expiryDateTime).getTime();
      if (!expiry || Number.isNaN(expiry)) return;
      const diff = expiry - now;
      if (diff <= 0) {
        newCountdowns[item.id] = 'Expired';
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        newCountdowns[item.id] = `${hours}h ${minutes}m`;
      }
    });
    setCountdowns(newCountdowns);
  };

  const formatExpiresIn = (item) => {
    const cached = countdowns[item.id];
    if (cached) return cached;
    if (!item || item.status !== 'APPROVED' || !item.timeLimit) return '—';
    const expiryMs = new Date(item.expiresAt || item.expiryDateTime).getTime();
    if (!expiryMs || Number.isNaN(expiryMs)) return 'N/A';
    const diff = expiryMs - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getProgressBarStyles = (item) => {
    if (!item || item.status !== 'APPROVED' || !item.timeLimit || !item.expiresAt) {
      return { color: 'bg-gray-200', width: '0%' };
    }
    const now = Date.now();
    const expiry = new Date(item.expiresAt || item.expiryDateTime).getTime();
    if (Number.isNaN(expiry)) {
      return { color: 'bg-gray-200', width: '0%' };
    }
    const diff = Math.max(0, expiry - now);
    const seconds = diff / 1000;
    let color;
    if (seconds >= 7200) {
      color = 'bg-green-500';
    } else if (seconds >= 3600) {
      color = 'bg-orange-500';
    } else {
      color = 'bg-red-500';
    }
    const totalMs = getTotalDurationMs(item.timeLimit);
    const fraction = totalMs > 0 ? Math.min(diff / totalMs, 1) : 0;
    return { color, width: `${fraction * 100}%` };
  };

  const getTotalDurationMs = (timeLimit) => {
    switch (timeLimit) {
      case 'ONE_DAY': return 24 * 60 * 60 * 1000;
      case 'THREE_DAYS': return 3 * 24 * 60 * 60 * 1000;
      case 'SEVEN_DAYS': return 7 * 24 * 60 * 60 * 1000;
      case 'FOURTEEN_DAYS': return 14 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    loadTimeLimits();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [activeGagesRes, issueGagesRes, deptsRes, funcsRes, opsRes, pendingCountRes] = await Promise.all([
        api.get('/gages/status/ACTIVE'),
        api.get('/gage-issues'),
        api.get('/departments'),
        api.get('/functions'),
        api.get('/operations'),
        countPendingApprovals()
      ]);
      setActiveGages(activeGagesRes.data || []);
      setIssueGages(issueGagesRes.data || []);
      setAvailableDepartments(deptsRes.data.map(d => d.name) || []);
      setAvailableFunctions(funcsRes.data.map(f => f.name) || []);
      setAvailableOperations(opsRes.data.map(o => o.name) || []);
      setPendingApprovalsCount(pendingCountRes || 0);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeLimits = async () => {
    try {
      const limits = await getReallocateTimeLimits();
      setAvailableTimeLimits(['ALL', ...limits]);
      if (limits.length > 0) setSelectedTimeLimit('ALL');
    } catch (err) {
      console.error('Failed to load time limits:', err);
      setAvailableTimeLimits(['ALL', 'ONE_DAY', 'THREE_DAYS', 'SEVEN_DAYS', 'FOURTEEN_DAYS']);
    }
  };

  const fetchTimeLimitedReallocations = async (timeLimit) => {
    try {
      let data;
      if (timeLimit === 'ALL') {
        const responses = await Promise.all(availableTimeLimits.slice(1).map(limit => getReallocatesByTimeLimit(limit)));
        data = responses.flat();
        const uniqueMap = new Map(data.map(d => [d.id, d]));
        data = Array.from(uniqueMap.values());
      } else {
        data = await getReallocatesByTimeLimit(timeLimit);
      }
      const list = Array.isArray(data)
        ? data
            .filter(item => item.status === 'APPROVED' && item.timeLimit && item.expiresAt)
            .sort((a, b) => b.id - a.id)
        : [];
      setTimeLimitedReallocations(list);
      updateCountdownsNow(list);
    } catch (err) {
      console.error('Failed to fetch time-limited reallocates:', err);
      alert('Failed to load time-limited reallocations.');
      setTimeLimitedReallocations([]);
      setCountdowns({});
    }
  };

  const fetchRecentTimeLimited = async () => {
    try {
      const responses = await Promise.all(availableTimeLimits.slice(1).map(limit => getReallocatesByTimeLimit(limit)));
      const flattened = responses.flat();
      const uniqueMap = new Map(flattened.map(d => [d.id, d]));
      const unique = Array.from(uniqueMap.values());
      const approved = unique.filter(d => d.status === 'APPROVED' && d.timeLimit && d.expiresAt);
      const sorted = approved.sort((a, b) => b.id - a.id);
      setRecentTimeLimited(sorted.slice(0, 4));
      updateCountdownsNow(sorted.slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch recent time-limited reallocates:', err);
    }
  };

  useEffect(() => {
    if (availableTimeLimits.length > 0) {
      fetchRecentTimeLimited();
    }
  }, [availableTimeLimits]);

  // Countdown Timer Effect for modal
  useEffect(() => {
    if (!showTimeLimitedModal || timeLimitedReallocations.length === 0) return;
    updateCountdownsNow();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newCountdowns = {};
      timeLimitedReallocations.forEach((item) => {
        if (item.status !== 'APPROVED' || !item.timeLimit || !item.expiresAt) return;
        const expiry = new Date(item.expiresAt || item.expiryDateTime).getTime();
        if (!expiry || Number.isNaN(expiry)) return;
        const diff = expiry - now;
        if (diff <= 0) {
          newCountdowns[item.id] = 'Expired';
          if (!processingExpiredMap[item.id]) {
            setProcessingExpiredMap(prev => ({ ...prev, [item.id]: true }));
            (async () => {
              try {
                await processExpiredReallocation(item.id);
                await fetchAllData();
                await fetchTimeLimitedReallocations(selectedTimeLimit);
                await fetchRecentTimeLimited();
              } catch (e) {
                setProcessingExpiredMap(prev => {
                  const copy = { ...prev };
                  delete copy[item.id];
                  return copy;
                });
              }
            })();
          }
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          newCountdowns[item.id] = `${hours}h ${minutes}m`;
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimeLimitedModal, timeLimitedReallocations]);

  // Countdown for recent reallocations (every minute)
  useEffect(() => {
    if (recentTimeLimited.length === 0) return;
    updateCountdownsNow(recentTimeLimited);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newCountdowns = {};
      recentTimeLimited.forEach((item) => {
        if (item.status !== 'APPROVED' || !item.timeLimit || !item.expiresAt) return;
        const expiry = new Date(item.expiresAt || item.expiryDateTime).getTime();
        if (!expiry || Number.isNaN(expiry)) return;
        const diff = expiry - now;
        if (diff <= 0) {
          newCountdowns[item.id] = 'Expired';
          if (!processingExpiredMap[item.id]) {
            setProcessingExpiredMap(prev => ({ ...prev, [item.id]: true }));
            (async () => {
              try {
                await processExpiredReallocation(item.id);
                await fetchAllData();
                await fetchRecentTimeLimited();
              } catch (e) {
                setProcessingExpiredMap(prev => {
                  const copy = { ...prev };
                  delete copy[item.id];
                  return copy;
                });
              }
            })();
          }
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          newCountdowns[item.id] = `${hours}h ${minutes}m`;
        }
      });
      setCountdowns(newCountdowns);
    }, 60000);
    return () => clearInterval(interval);
  }, [recentTimeLimited]);

  useEffect(() => {
    if (showTimeLimitedModal) {
      fetchTimeLimitedReallocations(selectedTimeLimit);
    }
  }, [showTimeLimitedModal, selectedTimeLimit]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchFilteredData();
  };

  const fetchFilteredData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [activeGagesRes, issueGagesRes] = await Promise.all([
        api.get('/gages/status/ACTIVE'),
        api.get('/gage-issues')
      ]);
      let filteredIssueGages = issueGagesRes.data || [];
      if (selectedDepartment) {
        filteredIssueGages = filteredIssueGages.filter(issue => issue.dept === selectedDepartment);
      }
      if (selectedFunction) {
        filteredIssueGages = filteredIssueGages.filter(issue => issue.func === selectedFunction);
      }
      if (selectedOperation) {
        filteredIssueGages = filteredIssueGages.filter(issue => issue.operation === selectedOperation);
      }
      setActiveGages(activeGagesRes.data || []);
      setIssueGages(filteredIssueGages);
    } catch (err) {
      console.error('Failed to fetch filtered data:', err);
      setError('Failed to load filtered data. Please check your selections.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedIssueId || !newStatus) return;
    try {
      const res = await api.put(`/gage-issues/${selectedIssueId}/status`, null, {
        params: { status: newStatus }
      });
      const updatedIssue = res.data;
      setIssueGages(prev =>
        prev.map(issue => (issue.id === selectedIssueId ? updatedIssue : issue))
      );
      setShowEditModal(false);
    } catch (err) {
      console.error('Status update error:', err);
      alert('Error updating status: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const handleGageDetails = async (serialNumber) => {
    if (!serialNumber) {
      alert('Serial number not available');
      return;
    }
    try {
      setLoadingGageDetails(true);
      setShowGageDetails(true);
      const res = await api.get(`/gages/serial/${encodeURIComponent(serialNumber)}`);
      setSelectedGage(res.data);
    } catch (err) {
      console.error('Failed to load gage details:', err);
      alert('Failed to load gage details. Gage may not exist.');
      setShowGageDetails(false);
    } finally {
      setLoadingGageDetails(false);
    }
  };

  const handleGageDetailsForReallocate = async (serialNumber) => {
    if (!serialNumber) {
      setModalGage(null);
      return;
    }
    try {
      setLoadingGageDetails(true);
      const res = await api.get(`/gages/serial/${encodeURIComponent(serialNumber)}`);
      setModalGage(res.data);
    } catch (err) {
      console.error('Failed to load gage details for reallocate:', err);
      setModalGage(null);
    } finally {
      setLoadingGageDetails(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'ISSUED': return 'bg-orange-100 text-orange-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    return new Date(isoDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [preselectGageId, setPreselectGageId] = useState(null);

  const openReallocateModal = async () => {
    try {
      const currentIssue = issueGages.find(issue => issue.id === selectedIssueId);
      if (currentIssue && currentIssue.serialNumber) {
        await handleGageDetailsForReallocate(currentIssue.serialNumber);
        if (modalGage?.id) setPreselectGageId(modalGage.id);
      } else {
        setModalGage(null);
        setPreselectGageId(null);
      }
    } finally {
      setShowReallocationModal(true);
    }
  };

  const handleChangeOperatorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIssueForChange?.id) return;
    try {
      const updated = await updateGageIssueAllocation(selectedIssueForChange.id, {
        department: newDepartment,
        functionName: newFunction,
        operationName: newOperation,
      });
      setIssueGages(prev => prev.map(i => i.id === selectedIssueForChange.id ? updated : i));
      setShowChangeOperatorModal(false);
    } catch (err) {
      console.error('Failed to update allocation:', err);
      alert('Failed to update operator allocation. Please try again.');
    }
  };

  const renderGageTable = (gages, type) => (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-blue-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Model Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Gage Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Manufacturer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Next Calibration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-50">
            {gages.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-blue-600">
                  No {type} gages found.
                </td>
              </tr>
            ) : (
              gages.map((gage) => (
                <tr key={gage.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">{gage.serialNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{gage.modelNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{gage.gageType?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{gage.category || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{gage.manufacturerName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(gage.status)}`}>
                      {gage.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(gage.nextCalibrationDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => handleGageDetails(gage.serialNumber)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => { setPreselectGageId(gage.id); setShowReallocationModal(true); }}
                      className="text-orange-600 hover:text-orange-900 font-medium"
                    >
                      Reallocate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIssueGageTable = (issues) => (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-blue-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Function</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Operation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-50">
            {issues.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-blue-600">
                  No issue gages found.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">{issue.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{issue.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{issue.serialNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{issue.dept || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{issue.func || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{issue.operation || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                      {issue.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{issue.priority || 'Medium'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setNewStatus(issue.status);
                        setPreselectGageId(null);
                        openReallocateModal();
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Reallocate Gage"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-16 6h12m0 0l-4 4m4-4l-4-4" />
                      </svg>
                      Reallocate
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIssueForChange(issue);
                        setNewDepartment(issue.dept || '');
                        setNewFunction(issue.func || '');
                        setNewOperation(issue.operation || '');
                        setShowChangeOperatorModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      title="Change Operator Allocation"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Change
                    </button>
                    {issue.serialNumber && (
                      <button
                        onClick={() => handleGageDetails(issue.serialNumber)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        title="View Gage Details"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    if (newEmail && isValidEmail(newEmail) && !selectedEmails.includes(newEmail)) {
      setSelectedEmails([...selectedEmails, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove) => {
    setSelectedEmails(selectedEmails.filter(email => email !== emailToRemove));
  };

  const recipientsHeight = selectedEmails.length > 4 ? 'max-h-48' : 'h-auto';

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <style>
        {`
          @keyframes shake {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(10deg); }
            20% { transform: rotate(-10deg); }
            30% { transform: rotate(10deg); }
            40% { transform: rotate(-10deg); }
            50% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-shake {
            animation: shake 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        {/* 🔔 BELL ICON REMOVED HERE */}
        <header className="flex items-center mb-8">
          <div>
            <p className="text-blue-700 mt-2">Manage and monitor gage calibration issues</p>
          </div>
        </header>

        {recentTimeLimited.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-8">
            {recentTimeLimited.map((item) => {
              const remaining = formatExpiresIn(item);
              const isExpired = remaining === 'Expired';
              const { color, width } = getProgressBarStyles(item);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 w-64 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-800">{item.gageSerialNumber || 'N/A'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {item.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Dept:</span>{' '}
                      {item.currentDepartment || item.originalDepartment || '—'} {' -> '}
                      {item.originalDepartment || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Func:</span>{' '}
                      {item.currentFunction || item.originalFunction || '—'} {' -> '}
                      {item.originalFunction || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Op:</span>{' '}
                      {item.currentOperation || item.originalOperation || '—'} {' -> '}
                      {item.originalOperation || '—'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                      {remaining}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ✨ Unified Button Styles */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { mode: 'all', label: 'All Gages', color: 'blue' },
            { mode: 'issue', label: 'Issue Gages', color: 'red' },
            { mode: 'active', label: 'Active Gages', color: 'green' },
          ].map(({ mode, label, color }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === mode
                  ? `bg-${color}-600/30 text-white`
                  : `bg-white text-${color}-700 border border-${color}-200 hover:bg-${color}-50`
              }`}
            >
              {label}
            </button>
          ))}

          <button
            onClick={() => setShowTimeLimitedModal(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              showTimeLimitedModal
                ? 'bg-amber-600/30 text-white'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
          Time-Limited Reallocations
          </button>

          <button
            onClick={() => setShowSendEmailModal(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              showSendEmailModal
                ? 'bg-green-600/30 text-white'
                : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
            }`}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <title>Mail</title>
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
            Send Mail
          </button>
        </div>

        {/* Rest of the UI remains unchanged... */}
        <div className="bg-white p-6 rounded-xl shadow mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Filter by Department, Function & Operation</h2>
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
              >
                <option value="">All Departments</option>
                {availableDepartments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Function</label>
              <select
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
              >
                <option value="">All Functions</option>
                {availableFunctions.map((func, index) => (
                  <option key={index} value={func}>{func}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Operation</label>
              <select
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
              >
                <option value="">All Operations</option>
                {availableOperations.map((op, index) => (
                  <option key={index} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 font-medium w-full"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {loading && <div className="text-blue-700 text-center py-4">Loading data...</div>}
        {error && <div className="text-red-600 text-center py-4 bg-red-50 rounded">{error}</div>}

        {!loading && !error && (
          <>
            {viewMode === 'all' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-red-800 mb-4">Issue Gages ({issueGages.length})</h2>
                  {renderIssueGageTable(issueGages)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-800 mb-4">Active Gages ({activeGages.length})</h2>
                  {renderGageTable(activeGages, 'active')}
                </div>
              </div>
            )}
            {viewMode === 'issue' && (
              <div>
                <h2 className="text-xl font-semibold text-red-800 mb-4">Issue Gages ({issueGages.length})</h2>
                {renderIssueGageTable(issueGages)}
              </div>
            )}
            {viewMode === 'active' && (
              <div>
                <h2 className="text-xl font-semibold text-green-800 mb-4">Active Gages ({activeGages.length})</h2>
                {renderGageTable(activeGages, 'active')}
              </div>
            )}
          </>
        )}

        {/* Modals remain unchanged... */}
        {showTimeLimitedModal && (
          <Modal
            title="⏳ Time-Limited Reallocations"
            onClose={() => setShowTimeLimitedModal(false)}
            size="max-w-6xl"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Time Limit</label>
                <select
                  value={selectedTimeLimit}
                  onChange={(e) => setSelectedTimeLimit(e.target.value)}
                  className="w-full md:w-64 p-2 border border-gray-300 rounded bg-white text-gray-900"
                >
                  {availableTimeLimits.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Gage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Original Dept/Func/Op</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Current Dept/Func/Op</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Time Limit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Expires In</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeLimitedReallocations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                          No time-limited reallocations found.
                        </td>
                      </tr>
                    ) : (
                      timeLimitedReallocations.map((item) => {
                        const { color, width } = getProgressBarStyles(item);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-blue-700">{item.gageSerialNumber || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {item.originalDepartment || '—'} / {item.originalFunction || '—'} / {item.originalOperation || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {item.currentDepartment || item.originalDepartment || '—'} / {item.currentFunction || item.originalFunction || '—'} / {item.currentOperation || item.originalOperation || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{item.timeLimit?.replace('_', ' ') || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm font-semibold">
                              {(() => {
                                const text = formatExpiresIn(item);
                                const cls = (text || '').toString().includes('Expired') ? 'text-red-600' : 'text-amber-600';
                                return <span className={cls}>{text}</span>;
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                {item.status?.replace('_', ' ') || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${color}`}
                                  style={{ width }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}

        {showChangeOperatorModal && (
          <Modal title="Change Operator Allocation" onClose={() => setShowChangeOperatorModal(false)}>
            <form onSubmit={handleChangeOperatorSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Department</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                >
                  <option value="">Select Department</option>
                  {availableDepartments.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Function</label>
                <select
                  value={newFunction}
                  onChange={(e) => setNewFunction(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                >
                  <option value="">Select Function</option>
                  {availableFunctions.map((func, index) => (
                    <option key={index} value={func}>{func}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Operation</label>
                <select
                  value={newOperation}
                  onChange={(e) => setNewOperation(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                >
                  <option value="">Select Operation</option>
                  {availableOperations.map((op, index) => (
                    <option key={index} value={op}>{op}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowChangeOperatorModal(false)}
                  className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDepartment && !newFunction && !newOperation}
                  className={`px-4 py-2 rounded-lg ${!newDepartment && !newFunction && !newOperation ? 'bg-gray-300/30 text-gray-600' : 'bg-blue-600/30 text-white hover:bg-blue-700'}`}
                >
                  Update
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showGageDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-blue-900">Gage Details</h3>
                <button
                  onClick={() => {
                    setShowGageDetails(false);
                    setSelectedGage(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              {loadingGageDetails ? (
                <div className="text-center py-8 text-blue-700">Loading gage details...</div>
              ) : selectedGage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Serial Number:</span> {selectedGage.serialNumber || 'N/A'}</div>
                        <div><span className="font-medium">Model Number:</span> {selectedGage.modelNumber || 'N/A'}</div>
                        <div><span className="font-medium">Gage Type:</span> {selectedGage.gageType?.name || 'N/A'}</div>
                        <div><span className="font-medium">Category:</span> {selectedGage.category || 'N/A'}</div>
                        <div><span className="font-medium">Manufacturer:</span> {selectedGage.manufacturerName || 'N/A'}</div>
                        <div><span className="font-medium">Status:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedGage.status)}`}>
                            {selectedGage.status?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Calibration Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Next Calibration:</span> {formatDate(selectedGage.nextCalibrationDate)}</div>
                        <div><span className="font-medium">Calibration Interval:</span> {selectedGage.calibrationInterval || 'N/A'} days</div>
                        <div><span className="font-medium">Remaining Days:</span> {selectedGage.remainingDays || 'N/A'}</div>
                        <div><span className="font-medium">Criticality:</span> {selectedGage.criticality || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Usage Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Max Users:</span> {selectedGage.maxUsersNumber || 'N/A'}</div>
                        <div><span className="font-medium">Usage Frequency:</span> {selectedGage.usageFrequency || 'N/A'}</div>
                        <div><span className="font-medium">Location:</span> {selectedGage.location || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {selectedGage.gageImage && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Gage Image</h4>
                        <img
                          src={`data:image/jpeg;base64,${selectedGage.gageImage}`}
                          alt="Gage"
                          className="w-full h-48 object-contain rounded border"
                        />
                      </div>
                    )}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Technical Specifications</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Measurement Range:</span> {selectedGage.measurementRange || 'N/A'}</div>
                        <div><span className="font-medium">Accuracy:</span> {selectedGage.accuracy || 'N/A'}</div>
                        <div><span className="font-medium">Purchase Date:</span> {formatDate(selectedGage.purchaseDate)}</div>
                      </div>
                    </div>
                    {selectedGage.notes && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                        <p className="text-sm text-gray-700">{selectedGage.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-600">No gage data available.</div>
              )}
            </div>
          </div>
        )}

        {showRequestDrawer && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              onClick={() => setShowRequestDrawer(false)}
            ></div>
            <div
              className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                showRequestDrawer ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">All Request Gages</h2>
                  <button
                    onClick={() => setShowRequestDrawer(false)}
                    className="text-gray-500 hover:text-gray-800 text-2xl"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-600">This section will display all gage requests.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {showRequestEmailModal && (
          <Modal title="Request Gage Reallocation" onClose={() => setShowRequestEmailModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Select Email (optional)</label>
                  <select
                    value={availableGmails.includes(requestEmail) ? requestEmail : ''}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                  >
                    <option value="">-- Choose saved Email --</option>
                    {availableGmails.map((g, idx) => (
                      <option key={idx} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Or enter Email (required)</label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={requestSubject}
                  onChange={(e) => setRequestSubject(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Message</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded bg-white text-blue-900 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestEmailModal(false)}
                  className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={requestDisabled || !isValidEmail(requestEmail)}
                  onClick={async () => {
                    try {
                      setRequestDisabled(true);
                      await sendMail({
                        from: requestEmail,
                        to: ["plant.hod@gagefx.com"],
                        subject: requestSubject,
                        body: requestBody,
                      });
                      alert('Request email sent');
                      setShowRequestEmailModal(false);
                    } catch (e) {
                      alert('Failed to send request email');
                    } finally {
                      setRequestDisabled(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${requestDisabled || !isValidEmail(requestEmail) ? 'bg-gray-300/30 text-gray-600' : 'bg-blue-600/30 text-white hover:bg-blue-700'}`}
                >
                  Submit Request
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showSendEmailModal && (
          <Modal title="Send Mail" onClose={() => setShowSendEmailModal(false)}>
            <div className="space-y-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-3">Add Recipients</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter email address (e.g., user@company.com)"
                        className="flex-1 p-3 border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                      />
                      <button
                        onClick={addEmail}
                        disabled={!newEmail || !isValidEmail(newEmail)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                          !newEmail || !isValidEmail(newEmail)
                            ? 'bg-gray-300/30 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600/30 text-white hover:bg-blue-700'
                        }`}
                      >
                        Add
                      </button>
                    </div>
                    <div className={`p-4 rounded-lg border border-gray-200 ${recipientsHeight} overflow-y-auto bg-gray-50`}>
                      {selectedEmails.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center italic">No recipients added yet. Start by entering an email above.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedEmails.map((email, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-blue-900 font-medium">{email}</span>
                              </div>
                              <button
                                onClick={() => removeEmail(email)}
                                className="text-red-600 hover:text-red-800 text-xs font-semibold ml-3 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      The same message will be sent to all added recipients.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-3">Email Content</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={sendSubject}
                        onChange={(e) => setSendSubject(e.target.value)}
                        placeholder="Enter email subject"
                        className="w-full p-3 border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        className="w-full p-3 border border-blue-300 rounded-lg bg-white text-blue-900 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        placeholder="Type your message here..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSendEmailModal(false);
                    setSelectedEmails([]);
                    setNewEmail('');
                    setSendSubject('GageFX Mail');
                    setSendMessage('Message from Plant HOD Dashboard');
                  }}
                  className="px-8 py-3 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={sendLoading || selectedEmails.length === 0}
                  onClick={async () => {
                    try {
                      setSendLoading(true);
                      await sendMail({
                        from: selectedEmails[0],
                        to: selectedEmails,
                        subject: sendSubject,
                        body: sendMessage || 'Mail message',
                      });
                      alert(`Mail sent successfully to ${selectedEmails.length} recipient(s).`);
                      setShowSendEmailModal(false);
                      setSelectedEmails([]);
                      setNewEmail('');
                      setSendSubject('GageFX Mail');
                      setSendMessage('Message from Plant HOD Dashboard');
                    } catch (e) {
                      alert('Failed to send mail. Please try again.');
                    } finally {
                      setSendLoading(false);
                    }
                  }}
                  className={`px-8 py-3 rounded-lg font-semibold flex items-center transition-colors ${
                    sendLoading || selectedEmails.length === 0
                      ? 'bg-gray-300/30 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600/30 text-white hover:bg-green-700'
                  }`}
                >
                  {sendLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <title>Mail</title>
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                      Send Mail
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        <ReallocationManagementModal
          isOpen={showReallocationModal}
          onClose={() => setShowReallocationModal(false)}
          onRefresh={fetchAllData}
          preselectGageId={preselectGageId}
        />
      </div>
    </div>
  );
};

export default PlantHODDashboard;