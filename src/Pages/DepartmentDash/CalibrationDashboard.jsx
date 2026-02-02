import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Settings,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Search,
  Bell,
  TrendingUp,
  BarChart3,
  PieChart,
  X,
  Save,
  ChevronRight
} from 'lucide-react';

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

// --------------------- Component ---------------------
const CalibrationDashboard = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddGaugeModal, setShowAddGaugeModal] = useState(false);

  // ---------- initial sample arrays ----------
  const upcomingCalibrations = [
    { id: 'CAL-001', name: 'Digital Caliper', lastCalibrated: '2024-03-15', dueDate: '2024-09-15', responsible: 'John Doe', priority: 'high', status: 'overdue' },
    { id: 'CAL-002', name: 'Micrometer Set', lastCalibrated: '2024-04-20', dueDate: '2024-09-18', responsible: 'Jane Smith', priority: 'medium', status: 'due' },
    { id: 'CAL-003', name: 'Pressure Gauge', lastCalibrated: '2024-05-10', dueDate: '2024-09-20', responsible: 'Mike Johnson', priority: 'high', status: 'upcoming' },
    { id: 'CAL-004', name: 'Torque Wrench', lastCalibrated: '2024-06-01', dueDate: '2024-09-25', responsible: 'Sarah Wilson', priority: 'low', status: 'upcoming' }
  ];

  const outForCalibration = [
    { id: 'CAL-005', name: 'Flow Meter', sentDate: '2024-08-25', expectedReturn: '2024-09-10', status: 'At Lab', vendor: 'CalibTech Inc' },
    { id: 'CAL-006', name: 'Temperature Probe', sentDate: '2024-08-30', expectedReturn: '2024-09-12', status: 'In Transit', vendor: 'PrecisionCal' },
    { id: 'CAL-007', name: 'Multimeter', sentDate: '2024-09-01', expectedReturn: '2024-09-14', status: 'Awaiting Report', vendor: 'CalibTech Inc' }
  ];

  const outOfCalibration = [
    { id: 'CAL-008', name: 'Oscilloscope', dueDate: '2024-08-15', daysOverdue: 19, priority: 'high', department: 'Electronics', status: 'outOfCalibration' },
    { id: 'CAL-009', name: 'Power Supply', dueDate: '2024-08-20', daysOverdue: 14, priority: 'medium', department: 'R&D', status: 'outOfCalibration' },
    { id: 'CAL-010', name: 'Function Generator', dueDate: '2024-08-28', daysOverdue: 6, priority: 'high', department: 'QC', status: 'outOfCalibration' }
  ];

  // Calculate due next 15 days count
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

  const departments = ['Production', 'QC', 'R&D', 'Electronics', 'Mechanical', 'Laboratory'];
  const priorities = [
    { value: 'high', label: 'High Priority', color: 'text-red-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'low', label: 'Low Priority', color: 'text-green-600' }
  ];
  const intervals = ['1', '3', '6', '12', '24', '36'];

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
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'due': return 'text-orange-600 bg-orange-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'At Lab': return 'text-purple-600 bg-purple-100';
      case 'In Transit': return 'text-blue-600 bg-blue-100';
      case 'Awaiting Report': return 'text-yellow-600 bg-yellow-100';
      case 'outOfCalibration': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ---------- combined list state ----------
  const [allGauges, setAllGauges] = useState(() => {
    const fromUpcoming = upcomingCalibrations.map(g => ({
      id: g.id,
      name: g.name,
      lastCalibrated: g.lastCalibrated || null,
      dueDate: g.dueDate || null,
      responsible: g.responsible || null,
      priority: g.priority || 'medium',
      status: g.status || 'upcoming',
      source: 'upcoming',
      vendor: null,
      department: null,
      model: null,
      manufacturer: null
    }));
    const fromOutFor = outForCalibration.map(g => ({
      id: g.id,
      name: g.name,
      sentDate: g.sentDate || null,
      expectedReturn: g.expectedReturn || null,
      vendor: g.vendor || null,
      status: g.status || 'outFor',
      source: 'outFor',
      priority: 'medium',
      responsible: null
    }));
    const fromOutOf = outOfCalibration.map(g => ({
      id: g.id,
      name: g.name,
      dueDate: g.dueDate || null,
      daysOverdue: g.daysOverdue || 0,
      priority: g.priority || 'high',
      status: g.status || 'outOfCalibration',
      source: 'outOf',
      department: g.department || null
    }));
    return [...fromUpcoming, ...fromOutFor, ...fromOutOf];
  });

  // Calculate summary data based on allGauges
  const summaryData = useMemo(() => {
    const totalGages = allGauges.length;
    const calibratedOnTime = allGauges.filter(g => 
      g.status !== 'overdue' && g.status !== 'outOfCalibration' && g.source !== 'outFor'
    ).length;
    const outForCalibration = allGauges.filter(g => g.source === 'outFor').length;
    const outOfCalibration = allGauges.filter(g => 
      g.status === 'outOfCalibration' || g.source === 'outOf'
    ).length;
    const dueNext15Days = calculateDueNext15Days(allGauges);

    return {
      totalGages,
      calibratedOnTime,
      outForCalibration,
      outOfCalibration,
      dueNext15Days
    };
  }, [allGauges]);

  // ---------- drawer state ----------
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('total');
  const [tableSearch, setTableSearch] = useState('');

  // ---------- open drawer when a card is clicked ----------
  const openDrawer = (filterKey) => {
    setSelectedFilter(filterKey);
    setTableSearch('');
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedFilter('total');
  };

  // ---------- helper: parse date & compute due-in-days ----------
  const parseDate = (d) => {
    if (!d) return null;
    const parsed = new Date(d);
    if (isNaN(parsed)) return null;
    return parsed;
  };

  const daysUntil = (d) => {
    const date = parseDate(d);
    if (!date) return null;
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000*60*60*24));
  };

  // ---------- derived filtered list for the drawer ----------
  const filteredGauges = useMemo(() => {
    let list = [...allGauges];

    switch (selectedFilter) {
      case 'total':
        break;
      case 'onTime':
        list = list.filter(g => g.status !== 'overdue' && g.status !== 'outOfCalibration' && g.source !== 'outFor');
        break;
      case 'outFor':
        list = list.filter(g => g.source === 'outFor');
        break;
      case 'outOf':
        list = list.filter(g => g.status === 'outOfCalibration' || g.source === 'outOf');
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
      default:
        break;
    }

    if (tableSearch && tableSearch.trim() !== '') {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter(g => (g.id && g.id.toLowerCase().includes(q)) || (g.name && g.name.toLowerCase().includes(q)));
    }

    return list;
  }, [allGauges, selectedFilter, tableSearch]);

  // ---------- add gauge ----------
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
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
    const newGauge = {
      id: data.gaugeId || `G-${Math.floor(Math.random()*9000 + 1000)}`,
      name: data.gaugeName || 'Unnamed',
      model: data.model || null,
      manufacturer: data.manufacturer || null,
      serialNumber: data.serialNumber || null,
      department: data.department || null,
      location: data.location || null,
      calibrationInterval: data.calibrationInterval,
      lastCalibrated: data.lastCalibrationDate || null,
      dueDate: data.nextDueDate || null,
      responsible: data.responsible || null,
      priority: data.priority || 'medium',
      calibrationStandard: data.calibrationStandard || null,
      notes: data.notes || null,
      status: (() => {
        const next = parseDate(data.nextDueDate);
        if (!next) return 'scheduled';
        return (next.getTime() < new Date().getTime()) ? 'overdue' : 'upcoming';
      })(),
      source: 'manual'
    };

    setAllGauges(prev => [newGauge, ...prev]);
    alert('Gauge added successfully!');
    reset();
    setShowAddGaugeModal(false);
  };

  // ---------- delete gauge from list ----------
  const deleteGauge = (id) => {
    if (!window.confirm('Delete this gauge?')) return;
    setAllGauges(prev => prev.filter(g => g.id !== id));
  };

  // ---------- export CSV for the current filtered list ----------
  const exportCSV = (rows) => {
    if (!rows || rows.length === 0) {
      alert('No rows to export.');
      return;
    }
    const headers = ['ID','Name','Model','Manufacturer','LastCalibrated','DueDate','Responsible','Priority','Status','Source'];
    const csvRows = [
      headers.join(',')
    ];
    rows.forEach(r => {
      const row = [
        `"${r.id || ''}"`,
        `"${r.name || ''}"`,
        `"${r.model || ''}"`,
        `"${r.manufacturer || ''}"`,
        `"${r.lastCalibrated || ''}"`,
        `"${r.dueDate || r.expectedReturn || ''}"`,
        `"${r.responsible || r.vendor || ''}"`,
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

  // ---------- UI render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Calibration Manager</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search gages..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-pink-700"
                onClick={() => setShowAddGaugeModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Gage</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards - CLICKABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div
            onClick={() => openDrawer('total')}
            className="cursor-pointer bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gages</p>
                <p className="text-3xl font-bold text-gray-900">{summaryData.totalGages}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => openDrawer('onTime')}
            className="cursor-pointer bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calibrated On Time</p>
                <p className="text-3xl font-bold text-green-600">{summaryData.calibratedOnTime}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {Math.round((summaryData.calibratedOnTime / summaryData.totalGages) * 100)}% Success Rate
              </span>
            </div>
          </div>

          <div
            onClick={() => openDrawer('outFor')}
            className="cursor-pointer bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out for Calibration</p>
                <p className="text-3xl font-bold text-blue-600">{summaryData.outForCalibration}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => openDrawer('outOf')}
            className="cursor-pointer bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Calibration</p>
                <p className="text-3xl font-bold text-red-600">{summaryData.outOfCalibration}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                Action Required
              </span>
            </div>
          </div>

          <div
            onClick={() => openDrawer('dueNext15')}
            className="cursor-pointer bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Next 15 Days</p>
                <p className="text-3xl font-bold text-orange-600">{summaryData.dueNext15Days}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium text-sm ${activeTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${activeTab === 'outFor' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('outFor')}
                >
                  Out for Calibration
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${activeTab === 'overdue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('overdue')}
                >
                  Overdue
                </button>
              </div>

              {/* Tab content */}
              <div className="mt-4">
                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Upcoming Calibrations</h3>
                      <span className="text-sm text-gray-500">Showing 3 of {upcomingCalibrations.length} calibrations</span>
                    </div>

                    {upcomingCalibrations.slice(0, 3).map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">Last Calibrated: {item.lastCalibrated}</p>
                            <p className="text-sm text-gray-500">Due Date: {item.dueDate}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Responsible: {item.responsible}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'outFor' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Out for Calibration</h3>
                    {outForCalibration.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">Sent: {item.sentDate}</p>
                            <p className="text-sm text-gray-500">Expected Return: {item.expectedReturn}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Vendor: {item.vendor}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'overdue' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Overdue Calibrations</h3>
                    {outOfCalibration.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">Due Date: {item.dueDate}</p>
                            <p className="text-sm text-red-500">{item.daysOverdue} days overdue</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Department: {item.department}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtable Calibration */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Subtable Calibration</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>Out for Calibration</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span>Out of Calibration</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span>Next 15 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Priority Dispatch */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Priority Dispatch</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-red-600">High Priority (3)</span>
                    <span className="text-sm text-gray-500">Send first to calibration</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-yellow-600">Medium Priority (5)</span>
                    <span className="text-sm text-gray-500">Schedule within week</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-green-600">Low Priority (5)</span>
                    <span className="text-sm text-gray-500">Can wait if needed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Quick Analytics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>On-Time Rate</span>
                    <span className="font-medium text-green-600">
                      {Math.round((summaryData.calibratedOnTime / summaryData.totalGages) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.round((summaryData.calibratedOnTime / summaryData.totalGages) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Turnaround Time</span>
                    <span className="font-medium text-blue-600">7.2 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Export */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Search pages...</h3>
              <div className="space-y-3">
                <button className="w-full text-left flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span>Priority</span>
                  <Filter className="h-4 w-4 text-gray-400" />
                </button>
                <button className="w-full text-left flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span>Status</span>
                  <Filter className="h-4 w-4 text-gray-400" />
                </button>
                <button className="w-full text-left flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span>Export</span>
                  <Download className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Add Gauge Modal ---------- */}
        {showAddGaugeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Schedule New Gage</h2>
                    <p className="text-sm text-gray-600">Enter the details for the new calibration gage</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowAddGaugeModal(false); reset(); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit(onSubmitGauge)} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span>Basic Information</span>
                    </h3>
                  </div>

                  {/* Gauge Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gage Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('gaugeName', {
                        required: true,
                        minLength: 2
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.gaugeName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Digital Caliper"
                    />
                    {errors.gaugeName && (
                      <p className="mt-1 text-sm text-red-600">{errors.gaugeName}</p>
                    )}
                  </div>

                  {/* Gauge ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gage ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('gaugeId', {
                        required: true,
                        pattern: {
                          value: /^[A-Z]{2,3}-\d{3,6}$/,
                          message: 'Format: ABC-123456'
                        }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.gaugeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., CAL-001234"
                    />
                    {errors.gaugeId && (
                      <p className="mt-1 text-sm text-red-600">{errors.gaugeId}</p>
                    )}
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('manufacturer', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Mitutoyo"
                    />
                    {errors.manufacturer && (
                      <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>
                    )}
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('model', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.model ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., CD-6CSX"
                    />
                    {errors.model && (
                      <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                    )}
                  </div>

                  {/* Serial Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('serialNumber', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.serialNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., SN123456789"
                    />
                    {errors.serialNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.serialNumber}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('department', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('location', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Building A, Room 101"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                    )}
                  </div>

                  {/* Calibration Information */}
                  <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <span>Calibration Information</span>
                    </h3>
                  </div>

                  {/* Calibration Interval */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calibration Interval (months) <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('calibrationInterval', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.calibrationInterval ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {intervals.map(interval => (
                        <option key={interval} value={interval}>{interval} months</option>
                      ))}
                    </select>
                    {errors.calibrationInterval && (
                      <p className="mt-1 text-sm text-red-600">{errors.calibrationInterval}</p>
                    )}
                  </div>

                  {/* Last Calibration Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Calibration Date
                    </label>
                    <input
                      type="date"
                      {...register('lastCalibrationDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Next Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      {...register('nextDueDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Responsible Person */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsible Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('responsible', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.responsible ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., John Doe"
                    />
                    {errors.responsible && (
                      <p className="mt-1 text-sm text-red-600">{errors.responsible}</p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('priority', { required: true })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.priority ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
                    )}
                  </div>

                  {/* Calibration Standard */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calibration Standard
                    </label>
                    <input
                      {...register('calibrationStandard')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ISO 9001:2015"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes or special instructions..."
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowAddGaugeModal(false); reset(); }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Schedule Gage</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------- DRAWER COMPONENT ---------- */}
        <div className={`fixed inset-y-0 right-0 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeDrawer}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold">
                  {selectedFilter === 'total' && 'All Gages'}
                  {selectedFilter === 'onTime' && 'Calibrated On Time'}
                  {selectedFilter === 'outFor' && 'Out for Calibration'}
                  {selectedFilter === 'outOf' && 'Out of Calibration'}
                  {selectedFilter === 'dueNext15' && 'Due in Next 15 Days'}
                </h3>
                <span className="text-sm text-gray-500">({filteredGauges.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search by id or name..."
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  />
                </div>
                <button
                  onClick={() => exportCSV(filteredGauges)}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left border-b">
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Model / Vendor</th>
                    <th className="py-3 px-4 font-medium">Last Calibrated</th>
                    <th className="py-3 px-4 font-medium">Due Date</th>
                    {selectedFilter === 'dueNext15' && <th className="py-3 px-4 font-medium">Days Until Due</th>}
                    <th className="py-3 px-4 font-medium">Responsible / Dept</th>
                    <th className="py-3 px-4 font-medium">Priority</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGauges.length === 0 && (
                    <tr>
                      <td colSpan={selectedFilter === 'dueNext15' ? 10 : 9} className="py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                  {filteredGauges.map((g) => {
                    const daysUntilDue = g.dueDate ? daysUntil(g.dueDate) : null;
                    
                    return (
                      <tr key={g.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{g.id}</td>
                        <td className="py-3 px-4">{g.name}</td>
                        <td className="py-3 px-4">{g.model || g.vendor || '-'}</td>
                        <td className="py-3 px-4">{g.lastCalibrated || '-'}</td>
                        <td className="py-3 px-4">{g.dueDate || g.expectedReturn || '-'}</td>
                        {selectedFilter === 'dueNext15' && (
                          <td className="py-3 px-4">
                            {daysUntilDue !== null ? (
                              <span className={`px-2 py-1 rounded text-xs ${
                                daysUntilDue <= 7 ? 'bg-red-100 text-red-600' : 
                                daysUntilDue <= 15 ? 'bg-orange-100 text-orange-600' : 
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {daysUntilDue} days
                              </span>
                            ) : '-'}
                          </td>
                        )}
                        <td className="py-3 px-4">{g.responsible || g.department || g.vendor || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(g.priority)}`}>
                            {g.priority || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(g.status)}`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button title="View" onClick={() => alert(`View ${g.id}`)} className="text-blue-200 hover:text-blue-800">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button title="Edit" onClick={() => alert(`Edit ${g.id}`)} className="text-green-200 hover:text-green-800">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button title="Delete" onClick={() => deleteGauge(g.id)} className="text-red-200 hover:text-red-800">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Overlay when drawer is open */}
        {showDrawer && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={closeDrawer}
          ></div>
        )}
      </div>
    </div>
  );
};

export default CalibrationDashboard;