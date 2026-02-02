import api from "../../../api/axios";

const CALIBRATION_BASE = '/calibration-manager';

const CalibrationApiService = {
  // ================================================================
  // 🔹 Gage CRUD Operations
  // ================================================================
  
  // Get all gages
  getAllGages: () => api.get('/gages'),

  // Get gage by ID
  getGageById: (id) => api.get(`/gages/${id}`),

  // Get gage by serial number
  getGageBySerialNumber: (serialNumber) => api.get(`/gages/serial/${serialNumber}`),

  // Create new gage
  createGage: (gageData) => api.post('/gages', gageData),

  // Create gage with file upload
  createGageWithFiles: (formData) => 
    api.post('/gages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Update gage
  updateGage: (id, gageData) => api.put(`/gages/${id}`, gageData),

  // Delete gage
  deleteGage: (id) => api.delete(`/gages/${id}`),

  // ================================================================
  // 🔹 Gage Status Operations
  // ================================================================
  
  // Update gage status
  updateGageStatus: (id, status) => 
    api.put(`/gages/${id}/status`, null, { params: { status } }),

  // Issue gage
  issueGage: (id) => api.put(`/gages/${id}/issue`),

  // Return gage
  returnGage: (id) => api.put(`/gages/${id}/return`),

  // Issue by serial number
  issueGageBySerialNumber: (serialNumber) => 
    api.put(`/gages/issue-by-serial/${serialNumber}`),

  // Reissue gage
  reissueGage: (formData) => 
    api.post('/gages/reissue', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // ================================================================
  // 🔹 Search and Filter Operations
  // ================================================================
  
  // Search gages
  searchGages: (searchTerm) => 
    api.get('/gages/search', { params: { searchTerm } }),

  // Filter by type
  getGagesByType: (gageTypeId) => api.get(`/gages/type/${gageTypeId}`),

  // Filter by type name
  getGagesByTypeName: (gageTypeName) => api.get(`/gages/by-type/${gageTypeName}`),

  // Filter by category
  getGagesByCategory: (category) => api.get(`/gages/category/${category}`),

  // Filter by location
  getGagesByLocation: (location) => api.get(`/gages/location/${location}`),

  // Filter by criticality
  getGagesByCriticality: (criticality) => api.get(`/gages/criticality/${criticality}`),

  // Filter by status
  getGagesByStatus: (status) => api.get(`/gages/status/${status}`),

  // ================================================================
  // 🔹 Calibration Operations
  // ================================================================
  
  // Schedule calibration
  scheduleCalibration: (gageId, scheduleData) => 
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/schedule`, scheduleData),

  // Complete calibration
  completeCalibration: (gageId, calibrationData) => 
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/complete`, calibrationData),

  // Add calibration record
  addCalibrationRecord: (gageId, calibrationHistory) => 
    api.post(`${CALIBRATION_BASE}/gages/${gageId}/records`, calibrationHistory),

  // Get calibration history
  getCalibrationHistory: (gageId) => 
    api.get(`${CALIBRATION_BASE}/gages/${gageId}/history`),

  // ================================================================
  // 🔹 Schedule Management
  // ================================================================
  
  // Get gage schedules
  getGageSchedules: (gageId) => api.get(`${CALIBRATION_BASE}/gages/${gageId}/schedules`),

  // Get upcoming schedules
  getUpcomingSchedules: () => api.get(`${CALIBRATION_BASE}/schedules/upcoming`),

  // Update schedule status
  updateScheduleStatus: (scheduleId, status) => 
    api.put(`${CALIBRATION_BASE}/schedules/${scheduleId}/status`, null, { params: { status } }),

  // ================================================================
  // 🔹 Enum/Dropdown Data
  // ================================================================
  
  // Get gage types
  getGageTypes: () => api.get('/gages/enums/gage-types'),

  // Get categories
  getCategories: () => api.get('/gages/enums/categories'),

  // Get usage frequencies
  getUsageFrequencies: () => api.get('/gages/enums/usage-frequencies'),

  // Get criticalities
  getCriticalities: () => api.get('/gages/enums/criticalities'),

  // Get locations
  getLocations: () => api.get('/gages/enums/locations'),

  // Get statuses
  getStatuses: () => api.get('/gages/enums/statuses'),

  // Get accreditations
  getAccreditations: () => api.get('/gages/enums/accreditations'),

  // Get calibration statuses
  getCalibrationStatuses: () => api.get('/gages/enums/calibration-statuses'),

  // ================================================================
  // 🔹 Validation
  // ================================================================
  
  // Validate serial number uniqueness
  isSerialNumberUnique: (serialNumber) => 
    api.get('/gages/validate/serial-number', { params: { serialNumber } }),

  // ================================================================
  // 🔹 Usage Operations
  // ================================================================
  
  // Validate gage for usage
  validateGageForUsage: (gageType, serialNumber) => 
    api.get('/gages/usage/validate', { params: { gageType, serialNumber } }),

  // Record gage usage
  recordGageUsage: (usageData) => api.post('/gages/usage/record', usageData),

  // Get available gage types
  getAvailableGageTypes: () => api.get('/gages/types/available'),

  // ================================================================
  // 🔹 Admin Operations
  // ================================================================
  
  // Manual trigger to update remaining days
  manualUpdateRemainingDays: () => api.post('/gages/admin/update-remaining-days'),
};

export default CalibrationApiService;