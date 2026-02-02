// src/Pages/DepartmentDash/GageManagerPage.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  getManufacturers,
  getServiceProviders,
  getGages,
  getAllGageTypes,
} from "../../api/api";
import ManufacturerDetails from "./ManufacturerDetails";
import ServiceProviderDetails from "./ServiceProviderDetails";
import GageForm from "./GageForm";
import GageInventory from "./GageInventory";
import ManufacturerInventory from "./ManufacturerInventory";
import ServiceProviderInventory from "./ServiceProviderInventory";
import GageTypeForm from "./GageTypeForm";
import GageTypeInventory from "./GageTypeInventory";
import InhouseCalibrationMachineForm from "./InhouseCalibrationMachineForm";
import InhouseCalibrationMachineInventory from "./InhouseCalibrationMachineInventory";
import GageScanner from "../Layout/GageScanner";
import Modal from "../Modal";
import GRRForm from "./GRRForm";
import GRRInventory from "./GRRInventory";
import {
  Factory,
  Wrench,
  Ruler,
  Settings,
  Grid,
  Plus,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  QrCode,
  Eye,
  Package,
  Clock,
  AlertCircle,
  Database,
  Layers,
  X,
  BarChart3,
  ClipboardCheck,
  Users,
  Shield,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Filter,
  FileText,
  Target,
  Scale,
  Thermometer,
  Compass,
  Zap,
  Server,
  PieChart,
  Home,
  Star,
  ChevronUp,
  ChevronDown,
  Network,
  Bell,
  Upload,
  Trash2,
  Edit,
  Copy,
  Menu,
  MoreVertical,
  Crosshair,
  Gauge,
  Circle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Professional Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      text: "text-blue-700",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      text: "text-emerald-700",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      text: "text-purple-700",
    },
    orange: {
      bg: "bg-gradient-to-br from-amber-500 to-amber-600",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      text: "text-amber-700",
    },
    red: {
      bg: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      text: "text-red-700",
    },
    teal: {
      bg: "bg-gradient-to-br from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      text: "text-teal-700",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        onClick ? "hover:border-gray-300" : ""
      }`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        {trend && (
          <div className="flex items-center">
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          </div>
        )}
      </div>

      <div className="mb-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
      </div>

      {subtitle && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {subtitle}
          </div>
        </div>
      )}

      {onClick && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon: Icon, color, action, badge }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    green: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600",
    orange: "bg-gradient-to-br from-amber-500 to-amber-600",
    teal: "bg-gradient-to-br from-teal-500 to-teal-600",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  };

  return (
    <button
      onClick={action}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 text-left hover:border-gray-300 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          {badge && (
            <div className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {badge}
            </div>
          )}
        </div>

        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        <div className="flex items-center text-sm font-medium text-gray-700">
          <span>Add New</span>
          <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
};

// Inventory Card Component
const InventoryCard = ({ title, count, icon: Icon, color, onClick, status, subtitle }) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      hover: "hover:shadow-blue-100",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      hover: "hover:shadow-emerald-100",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      hover: "hover:shadow-purple-100",
    },
    orange: {
      bg: "bg-gradient-to-br from-amber-500 to-amber-600",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      hover: "hover:shadow-amber-100",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 text-left w-full hover:border-gray-300 relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-gray-900">{count}</div>
          <div className="text-xs text-gray-500">Items</div>
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      
      {subtitle && (
        <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
      )}
      
      {status && (
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          {status}
        </div>
      )}

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center text-sm text-gray-600">
          <span>View Details</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </button>
  );
};

// Main Component
const GageManagerPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturers, setManufacturers] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [gages, setGages] = useState([]);
  const [gageTypes, setGageTypes] = useState([]);
  const [inhouseCalibrationMachines, setInhouseCalibrationMachines] = useState([]);
  const [grrStudies, setGRRStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showGageInventoryInline, setShowGageInventoryInline] = useState(false);
  const [isQuickActionsCollapsed, setIsQuickActionsCollapsed] = useState(false);
  const [isInventoryCollapsed, setIsInventoryCollapsed] = useState(false);
  const gageInventoryRef = useRef(null);

  // Real-time analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalGages = gages.filter(g => g.isActive !== false).length;
    const calibratedThisMonth = gages.filter(g => {
      if (!g.lastCalibrated) return false;
      const calDate = new Date(g.lastCalibrated);
      return calDate >= startOfMonth && calDate <= now;
    }).length;
    const dueForCalibration = gages.filter(g => {
      if (!g.nextCalibrationDue) return false;
      return new Date(g.nextCalibrationDue) <= now;
    }).length;
    const calibratedRecently = gages.filter(g => {
      if (!g.lastCalibrated) return false;
      const calDate = new Date(g.lastCalibrated);
      return calDate >= thirtyDaysAgo && calDate <= now;
    }).length;

    const calibrationRate = totalGages > 0 ? Math.round((calibratedRecently / totalGages) * 100) : 0;
    const duePercentage = totalGages > 0 ? Math.round((dueForCalibration / totalGages) * 100) : 0;

    return {
      totalGages,
      calibratedThisMonth,
      dueForCalibration,
      calibratedRecently,
      calibrationRate,
      duePercentage,
      activeManufacturers: manufacturers.length,
      certifiedProviders: serviceProviders.length,
      totalGageTypes: gageTypes.length,
      totalItems: gages.length + gageTypes.length + manufacturers.length + serviceProviders.length + grrStudies.length,
      complianceRate: Math.max(0, 100 - duePercentage)
    };
  }, [gages, manufacturers, serviceProviders, gageTypes, grrStudies]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [mfgs, sps, ggs, types] = await Promise.all([
          getManufacturers(),
          getServiceProviders(),
          getGages(),
          getAllGageTypes(),
        ]);

        setManufacturers(Array.isArray(mfgs) ? mfgs : []);
        setServiceProviders(Array.isArray(sps) ? sps : []);
        setGages(Array.isArray(ggs) ? ggs : []);
        setGageTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setShowGageInventoryInline(false); // Also close inline view when modal closes
  };

  const handleSave = (type, data) => {
    const newItem = { ...data, id: data.id || Date.now().toString() };
    switch (type) {
      case "manufacturer":
        setManufacturers((prev) => [...prev, newItem]);
        break;
      case "serviceProvider":
        setServiceProviders((prev) => [...prev, newItem]);
        break;
      case "gage":
        setGages((prev) => [...prev, newItem]);
        break;
      case "gageType":
        setGageTypes((prev) => [...prev, newItem]);
        break;
      case "inhouseCalibrationMachine":
        setInhouseCalibrationMachines((prev) => [...prev, newItem]);
        break;
      case "grr":
        setGRRStudies((prev) => [...prev, newItem]);
        break;
      default:
        break;
    }
    closeModal();
  };

  const handleGageInventoryClick = () => {
    // Remove the inline view functionality and open as modal instead
    setShowGageInventoryInline(false);
    setActiveModal("viewGage");
  };

  const handleCloseGageInventory = () => {
    setShowGageInventoryInline(false);
  };

  // Quick Actions
  const quickActions = [
    {
      actionKey: "gage",
      title: "Add New Gage",
      description: "Add new measurement equipment",
      icon: Ruler,
      color: "blue",
      badge: "Equipment"
    },
    {
      actionKey: "gageType",
      title: "Create Gage Type",
      description: "Define equipment category",
      icon: Grid,
      color: "purple",
      badge: "Category"
    },
    {
      actionKey: "manufacturer",
      title: "Add Manufacturer",
      description: "Register OEM partner",
      icon: Factory,
      color: "green",
      badge: "Partner"
    },
    {
      actionKey: "serviceProvider",
      title: "Add Service Provider",
      description: "Authorized service partner",
      icon: Wrench,
      color: "orange",
      badge: "Service"
    },

    {
      actionKey: "scanBarcode",
      title: "Scan Equipment",
      description: "Quick QR/Barcode scan",
      icon: QrCode,
      color: "indigo",
      badge: "Quick"
    },
      {
      actionKey: "newGRR",
      title: "New GR&R Study",
      description: "Create gauge R&R analysis",
      icon: BarChart3,
      color: "teal",
      badge: "Quality"
    },
  ];

  // Inventory Items - Updated to use modal for Gage Inventory
  const inventoryItems = [
    {
      actionKey: "viewGage",
      title: "Gage Inventory",
      count: gages.length,
      icon: Ruler,
      color: "blue",
      status: `${analytics.calibrationRate}% calibrated`,
      subtitle: "Measurement equipment",
      onClick: () => setActiveModal("viewGage") // Changed to open modal
    },
    {
      actionKey: "viewGageType",
      title: "Gage Types",
      count: gageTypes.length,
      icon: Grid,
      color: "purple",
      status: "Categories",
      subtitle: "Equipment classifications",
      onClick: () => setActiveModal("viewGageType")
    },
    {
      actionKey: "viewManufacturer",
      title: "Manufacturers",
      count: manufacturers.length,
      icon: Factory,
      color: "green",
      status: "Active partners",
      subtitle: "OEM manufacturers",
      onClick: () => setActiveModal("viewManufacturer")
    },
    {
      actionKey: "viewServiceProvider",
      title: "Service Providers",
      count: serviceProviders.length,
      icon: Wrench,
      color: "orange",
      status: "Certified",
      subtitle: "Service partners",
      onClick: () => setActiveModal("viewServiceProvider")
    },

    {
      actionKey: "viewCalibrationMachines",
      title: "Calibration Machines",
      count: inhouseCalibrationMachines.length,
      icon: Settings,
      color: "indigo",
      status: "Equipment",
      subtitle: "Internal calibration tools",
      onClick: () => setActiveModal("viewInhouseCalibrationMachine")
    },
    {
      actionKey: "viewGRR",
      title: "GR&R Studies",
      count: "6",
      icon: BarChart3,
      color: "teal",
      status: "Analyses",
      subtitle: "Measurement system studies",
      onClick: () => setActiveModal("viewGRR")
    },
  ];

  // Filter cards based on search query
  const filteredQuickActions = quickActions.filter(action =>
    action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInventoryItems = inventoryItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-semibold">Loading Gage Management System</p>
          <p className="text-sm text-gray-500 mt-2">Initializing enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
          <div className="text-red-500 mb-6 flex justify-center">
            <div className="relative">
              <AlertCircle className="w-16 h-16" />
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Connection Error</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gage Management System</h1>
                  <p className="text-gray-600 text-sm">Precision Measurement Control</p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-1 pl-6 border-l border-gray-200">


              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards, equipment, partners..."
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none bg-white w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              
              <button 
                onClick={() => setActiveModal("gage")}
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-sm font-semibold text-white transition-all duration-300 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Gage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Gages"
            value={analytics.totalGages}
            icon={Database}
            color="blue"
            trend={12}
            subtitle="Active equipment"
          />
          
          <StatCard
            title="Calibration Compliance"
            value={`${analytics.complianceRate}%`}
            icon={CheckCircle}
            color="green"
            trend={5}
            subtitle="Within specifications"
          />
          
          <StatCard
            title="Due for Calibration"
            value={analytics.dueForCalibration}
            icon={AlertTriangle}
            color="red"
            subtitle="Require attention"
            onClick={() => setActiveModal("viewGage")}
          />
          
          <StatCard
            title="Monthly Activity"
            value="27"
            icon={TrendingUp}
            color="purple"
            trend={8}
            subtitle="This month"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & System Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  <p className="text-sm text-gray-600">Register new equipment and partners</p>
                </div>
                <button
                  onClick={() => setIsQuickActionsCollapsed(!isQuickActionsCollapsed)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-gray-900 transition-colors"
                >
                  <span>{isQuickActionsCollapsed}</span>
                  {isQuickActionsCollapsed ? (
                    <ChevronDown className="w-6 h-6 transition-transform duration-300" />
                  ) : (
                    <ChevronUp className="w-6 h-6 transition-transform duration-300" />
                  )}
                </button>
              </div>
              
              <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isQuickActionsCollapsed ? 'max-h-0' : 'max-h-[1000px]'
                }`}
              >
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuickActions.length > 0 ? (
                      filteredQuickActions.map((action) => (
                        <QuickActionCard
                          key={action.actionKey}
                          {...action}
                          action={() => setActiveModal(action.actionKey)}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">No quick actions found for "{searchQuery}"</p>
                          <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Overview */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Overview</h2>
                  <p className="text-sm text-gray-600">Manage existing equipment and partners</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsInventoryCollapsed(!isInventoryCollapsed)}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-gray-900 transition-colors"
                  >
                    <span>{isInventoryCollapsed }</span>
                    {isInventoryCollapsed ? (
                      <ChevronDown className="w-6 h-6 transition-transform duration-300" />
                    ) : (
                      <ChevronUp className="w-6 h-6 transition-transform duration-300" />
                    )}
                  </button>
    
                </div>
              </div>
              
              <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isInventoryCollapsed ? 'max-h-0' : 'max-h-[1000px]'
                }`}
              >
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInventoryItems.length > 0 ? (
                      filteredInventoryItems.map((item) => (
                        <InventoryCard
                          key={item.actionKey}
                          {...item}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">No inventory items found for "{searchQuery}"</p>
                          <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - System Info & Recent Activity */}
          <div className="space-y-6">
            
              

      

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: CheckCircle, color: "text-green-500", text: "Calibration completed for Micrometer #1234", time: "10 min ago" },
                  { icon: Plus, color: "text-blue-500", text: "New gage added: Caliper #5678", time: "1 hour ago" },
                  { icon: Factory, color: "text-purple-500", text: "Manufacturer profile updated", time: "2 hours ago" },
                  { icon: AlertTriangle, color: "text-amber-500", text: "Calibration due for Pressure Gauge #9012", time: "5 hours ago" },
                  { icon: BarChart3, color: "text-teal-500", text: "GR&R study completed", time: "1 day ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-full ${activity.color.replace('text-', 'bg-')}/10 mt-0.5`}>
                      <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "manufacturer" && (
        <Modal title="Add Manufacturer" onClose={closeModal} size="lg">
          <ManufacturerDetails onClose={closeModal} onSave={(data) => handleSave("manufacturer", data)} />
        </Modal>
      )}
      {activeModal === "serviceProvider" && (
        <Modal title="Add Service Provider" onClose={closeModal} size="lg">
          <ServiceProviderDetails onClose={closeModal} onSave={(data) => handleSave("serviceProvider", data)} />
        </Modal>
      )}
      {activeModal === "gage" && (
        <Modal title="Add New Measurement Equipment" onClose={closeModal} size="xl">
          <GageForm onClose={closeModal} onSave={(data) => handleSave("gage", data)} />
        </Modal>
      )}
      {activeModal === "gageType" && (
        <Modal title="Add Gage Type" onClose={closeModal}>
          <GageTypeForm onClose={closeModal} onSave={(data) => handleSave("gageType", data)} />
        </Modal>
      )}
      {activeModal === "inhouseCalibrationMachine" && (
        <Modal title="Add Calibration Machine" onClose={closeModal} size="lg">
          <InhouseCalibrationMachineForm onClose={closeModal} onSave={(data) => handleSave("inhouseCalibrationMachine", data)} />
        </Modal>
      )}
      {activeModal === "newGRR" && (
        <Modal title="New GR&R Study" onClose={closeModal} size="lg">
          <GRRForm
            onClose={closeModal}
            onSave={(data) => handleSave("grr", data)}
            gages={gages}
          />
        </Modal>
      )}
      {activeModal === "viewManufacturer" && (
        <Modal title="Manufacturer Inventory" onClose={closeModal} size="xl">
          <ManufacturerInventory isOpen={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "viewServiceProvider" && (
        <Modal title="Service Provider Inventory" onClose={closeModal} size="xl">
          <ServiceProviderInventory isOpen={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "viewGageType" && (
        <Modal title="Gage Type Inventory" onClose={closeModal} size="xl">
          <GageTypeInventory isOpen={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "viewInhouseCalibrationMachine" && (
        <Modal title="Calibration Machine Inventory" onClose={closeModal} size="xl">
          <InhouseCalibrationMachineInventory isOpen={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "viewGRR" && (
        <Modal title="GR&R Studies" onClose={closeModal} size="xl">
          <GRRInventory isOpen={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "viewGage" && (
        <Modal title="Gage Inventory" onClose={closeModal} size="xl">
          <GageInventory isModal={true} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === "scanBarcode" && <GageScanner onClose={closeModal} onScanResult={() => { }} />}
    </div>
  );
};

export default GageManagerPage;