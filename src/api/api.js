import api from './axios';

// Users
export const getUsers = () => api.get('/users').then(r => r.data);
export const createUser = (payload) => api.post('/users', payload).then(r => r.data);
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload).then(r => r.data);
export const toggleUserActive = (id, active) => api.patch(`/users/${id}/status`, null, { params: { active } }).then(r => r.data);

// Add to your existing api.js file
export const updateUserProfileImage = (userId, profileImage) => 
  api.patch(`/users/${userId}`, { profileImage }).then(r => r.data);

// Bulk User Upload - FIXED VERSION
export const bulkUploadUsers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/users/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for large files
    });
    
    return response.data;
  } catch (error) {
    console.error('Bulk upload error:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors?.[0] || 
                        error.message || 
                        'Upload failed. Please check the file format and try again.';
    throw new Error(errorMessage);
  }
};

export const downloadBulkTemplate = async () => {
  try {
    const response = await api.get('/users/bulk-template-download', {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_bulk_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download template error:', error);
    throw new Error('Failed to download template');
  }
};

// Departments
export const getDepartments = () => api.get('/departments').then(r => r.data);
export const createDepartment = (payload) => api.post('/departments', payload).then(r => r.data);
export const updateDepartment = (id, payload) => api.put(`/departments/${id}`, payload).then(r => r.data);
export const toggleDepartmentActive = (id, active) => api.patch(`/departments/${id}/status`, null, { params: { active } }).then(r => r.data);

// Functions
export const getFunctions = () => api.get('/functions').then(r => r.data);
export const createFunction = (payload) => api.post('/functions', payload).then(r => r.data);
export const updateFunction = (id, payload) => api.put(`/functions/${id}`, payload).then(r => r.data);
export const toggleFunctionActive = (id, active) => api.patch(`/functions/${id}/status`, null, { params: { active } }).then(r => r.data);

// Operations
export const getOperations = () => api.get('/operations').then(r => r.data);
export const createOperation = (payload) => api.post('/operations', payload).then(r => r.data);
export const updateOperation = (id, payload) => api.put(`/operations/${id}`, payload).then(r => r.data);
export const toggleOperationActive = (id, active) => api.patch(`/operations/${id}/status`, null, { params: { active } }).then(r => r.data);

// Roles
export const getRoles = () => api.get('/roles').then(r => r.data);
export const createRole = (payload) => api.post('/roles', payload).then(r => r.data);
export const updateRole = (id, payload) => api.put(`/roles/${id}`, payload).then(r => r.data);
export const toggleRoleActive = (id, active) => api.patch(`/roles/${id}/status`, null, { params: { active } }).then(r => r.data);

// Gage Issues
export const createGageIssue = (payload) => api.post('/gage-issues', payload).then(r => r.data);
export const listGageIssues = () => api.get('/gage-issues').then(r => r.data);
export const countGageIssues = () => api.get('/gage-issues/count').then(r => r.data);
export const updateGageIssueAllocation = (issueId, { department, functionName, operationName, assignedTo }) =>
  api.put(`/gage-issues/${issueId}/allocation`, null, {
    params: {
      department,
      function: functionName,
      operation: operationName,
      assignedTo,
    },
  }).then(r => r.data);

// Gage Barcode Scanning
export const scanGageByBarcode = (serialNumber) =>
  api.get(`/gages/scan/${encodeURIComponent(serialNumber)}`).then(r => r.data);

export const scanGageByBarcodeImage = (barcodeImageFile) => {
  const formData = new FormData();
  formData.append('barcodeImage', barcodeImageFile);
  return api.post('/gages/scan/upload', formData).then(r => r.data);
};

// Operator-filtered Gage Issues
export const getOperatorFilteredGageIssues = (departments, functions = [], operations = []) => {
  const params = new URLSearchParams();
  departments.forEach(dept => params.append('departments', dept));
  functions.forEach(func => params.append('functions', func));
  operations.forEach(op => params.append('operations', op));
  return api.get(`/gage-issues/operator-filtered?${params.toString()}`).then(r => r.data);
};

export const getOperatorFilteredGageIssuesByPriority = (departments, functions = [], operations = []) => {
  const params = new URLSearchParams();
  departments.forEach(dept => params.append('departments', dept));
  functions.forEach(func => params.append('functions', func));
  operations.forEach(op => params.append('operations', op));
  return api.get(`/gage-issues/operator-filtered/priority?${params.toString()}`).then(r => r.data);
};

// Gages
export const getGages = () => api.get('/gages').then(r => r.data);
export const getGageBySerial = (serial) => api.get(`/gages/serial/${encodeURIComponent(serial)}`).then(r => r.data);

// Gage Usage Operations
export const validateGageForUsage = (gageType, serialNumber) =>
  api.get('/gages/usage/validate', {
    params: { gageType, serialNumber }
  }).then(r => r.data);

export const recordGageUsage = (usageData) =>
  api.post('/gages/usage/record', usageData).then(r => r.data);

export const getGagesByType = (gageTypeName) =>
  api.get(`/gages/by-type/${encodeURIComponent(gageTypeName)}`).then(r => r.data);

export const getAvailableGageTypes = () =>
  api.get('/gages/types/available').then(r => r.data);

// Inventory/Reference Data
export const getManufacturers = () => api.get('/manufacturers').then(r => r.data);
export const getServiceProviders = () => api.get('/service-providers').then(r => r.data);
export const getAllGageTypes = () => api.get('/gage-types/all').then(r => r.data);

// Jobs
export const getJobs = () => api.get('/jobs').then(r => r.data);
export const createJob = (payload) => api.post('/jobs', payload).then(r => r.data);
export const createJobWithGageUsage = (payload) => api.post('/jobs/with-gage-usage', payload).then(r => r.data);
export const updateJob = (id, payload) => api.put(`/jobs/${id}`, payload).then(r => r.data);
export const getJobById = (id) => api.get(`/jobs/${id}`).then(r => r.data);
export const getJobByJobNumber = (jobNumber) => api.get(`/jobs/job-number/${encodeURIComponent(jobNumber)}`).then(r => r.data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`).then(r => r.data);
export const countJobs = () => api.get('/jobs/count').then(r => r.data);

// Operator-filtered Jobs
export const getOperatorFilteredJobs = (departments, functions = [], operations = []) => {
  const params = new URLSearchParams();
  departments.forEach(dept => params.append('departments', dept));
  functions.forEach(func => params.append('functions', func));
  operations.forEach(op => params.append('operations', op));
  return api.get(`/jobs/operator-filtered?${params.toString()}`).then(r => r.data);
};

export const getOperatorFilteredJobsByPriority = (departments, functions = [], operations = []) => {
  const params = new URLSearchParams();
  departments.forEach(dept => params.append('departments', dept));
  functions.forEach(func => params.append('functions', func));
  operations.forEach(op => params.append('operations', op));
  return api.get(`/jobs/operator-filtered/priority?${params.toString()}`).then(r => r.data);
};

// Job Usage Tracking
export const getJobsByGageSerialNumber = (serialNumber) =>
  api.get(`/jobs/gage/${encodeURIComponent(serialNumber)}`).then(r => r.data);

export const getUsageRecordsByOperator = (operatorUsername) =>
  api.get(`/jobs/operator/${encodeURIComponent(operatorUsername)}`).then(r => r.data);

export const getTotalUsesForGage = (serialNumber) =>
  api.get(`/jobs/usage/total-uses/${encodeURIComponent(serialNumber)}`).then(r => r.data);

export const getTotalDaysUsedForGage = (serialNumber) =>
  api.get(`/jobs/usage/total-days/${encodeURIComponent(serialNumber)}`).then(r => r.data);

// Mail
export const sendMail = ({ to, subject, body, html, from }) =>
  api.post('/mail/send', { to, subject, body, html, from }).then(r => r.data);

// Reallocation System
export const createReallocateRequest = (payload) => api.post('/reallocates', payload).then(r => r.data);
export const getReallocates = () => api.get('/reallocates').then(r => r.data);
export const getReallocateById = (id) => api.get(`/reallocates/${id}`).then(r => r.data);
export const updateReallocate = (id, payload) => api.put(`/reallocates/${id}`, payload).then(r => r.data);
export const deleteReallocate = (id) => api.delete(`/reallocates/${id}`).then(r => r.data);

// Reallocation Approval Operations
export const approveReallocateRequest = (payload) => api.post('/reallocates/approve', payload).then(r => r.data);
export const rejectReallocateRequest = (id, rejectedBy, reason) =>
  api.post(`/reallocates/${id}/reject`, null, { params: { rejectedBy, reason } }).then(r => r.data);
export const cancelReallocateRequest = (id, cancelledBy, reason) =>
  api.post(`/reallocates/${id}/cancel`, null, { params: { cancelledBy, reason } }).then(r => r.data);

// Reallocation Return Operations
export const returnGage = (id, returnedBy, reason) =>
  api.post(`/reallocates/${id}/return`, null, { params: { returnedBy, reason } }).then(r => r.data);
export const forceReturnGage = (id, returnedBy, reason) =>
  api.post(`/reallocates/${id}/force-return`, null, { params: { returnedBy, reason } }).then(r => r.data);

// Reallocation Query Operations
export const getReallocatesByStatus = (status) => api.get(`/reallocates/status/${status}`).then(r => r.data);
export const getReallocatesByRequester = (requestedBy) => api.get(`/reallocates/requester/${requestedBy}`).then(r => r.data);
export const getReallocatesByApprover = (approvedBy) => api.get(`/reallocates/approver/${approvedBy}`).then(r => r.data);
export const getReallocatesByDepartment = (department) => api.get(`/reallocates/department/${department}`).then(r => r.data);
export const getReallocatesByFunction = (functionName) => api.get(`/reallocates/function/${functionName}`).then(r => r.data);
export const getReallocatesByOperation = (operation) => api.get(`/reallocates/operation/${operation}`).then(r => r.data);
export const getReallocatesByGageId = (gageId) => api.get(`/reallocates/gage/${gageId}`).then(r => r.data);
export const getReallocatesByGageSerialNumber = (serialNumber) => api.get(`/reallocates/gage/serial/${serialNumber}`).then(r => r.data);

// Reallocation Filter Operations
export const getFilteredReallocates = (department, functionName, operation, status) => {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  if (functionName) params.append('function', functionName);
  if (operation) params.append('operation', operation);
  if (status) params.append('status', status);
  return api.get(`/reallocates/filtered?${params.toString()}`).then(r => r.data);
};
export const getUserInvolvedReallocates = (username) => api.get(`/reallocates/user/${username}`).then(r => r.data);

// Reallocation Time-based Operations
export const getExpiredReallocates = () => api.get('/reallocates/expired').then(r => r.data);
export const getReallocatesExpiringSoon = () => api.get('/reallocates/expiring-soon').then(r => r.data);
export const processExpiredReallocation = (id) => api.post(`/reallocates/${id}/process-expired`).then(r => r.data);

// Reallocation Statistics
export const countActiveReallocationsByDepartment = (department) =>
  api.get(`/reallocates/stats/department/${department}/active-count`).then(r => r.data);
export const countPendingApprovals = () => api.get('/reallocates/stats/pending-approvals').then(r => r.data);
export const getReallocatesByTimeLimit = (timeLimit) => api.get(`/reallocates/time-limit/${timeLimit}`).then(r => r.data);

// Reallocation Validation
export const isGageAvailableForReallocation = (gageId) =>
  api.get(`/reallocates/validate/gage/${gageId}/available`).then(r => r.data);
export const canUserRequestReallocation = (username, gageId) =>
  api.get(`/reallocates/validate/user/${username}/gage/${gageId}/can-request`).then(r => r.data);

// Reallocation Admin Operations
export const processAllExpiredReallocations = () => api.post('/reallocates/admin/process-expired').then(r => r.data);
export const sendExpirationNotifications = () => api.post('/reallocates/admin/send-expiration-notifications').then(r => r.data);

// Reallocation History and Repeated Request Operations
export const getCompletedReallocationsForGage = (gageId) => api.get(`/reallocates/gage/${gageId}/completed-history`).then(r => r.data);
export const getReallocationHistoryForOperator = (operatorUsername) => api.get(`/reallocates/operator/${operatorUsername}/history`).then(r => r.data);

// Reallocation Enum Endpoints
export const getReallocateStatuses = () => api.get('/reallocates/enums/statuses').then(r => r.data);
export const getReallocateTimeLimits = () => api.get('/reallocates/enums/time-limits').then(r => r.data);

// Forum APIs with error handling
export const sendCallNotification = async (groupId, action, caller, callerName, targetUser = null) => {
  try {
    const response = await fetch('http://localhost:8080/api/forum/call-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        action,
        caller,
        callerName,
        targetUser,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error('Failed to send call notification');
    return await response.json();
  } catch (error) {
    console.warn('Forum service unavailable:', error);
    return { success: false, message: 'Forum service temporarily unavailable' };
  }
};

export const checkActiveCalls = async (groupId) => {
  try {
    const response = await fetch(`http://localhost:8080/api/forum/active-calls?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to check active calls');
    return await response.json();
  } catch (error) {
    console.warn('Forum service unavailable:', error);
    return { activeCalls: [] };
  }
};
export const getGRRStudies = () => api.get('/grr').then(r => r.data);  
export const getGRRStudyById = (id) => api.get(`/grr/${id}`).then(r => r.data);  
export const createGRRStudy = (studyData) => api.post('/grr', studyData).then(r => r.data);  
export const updateGRRStudy = (id, studyData) => api.put(`/grr/${id}`, studyData).then(r => r.data);  
export const deleteGRRStudy = (id) => api.delete(`/grr/${id}`).then(r => r.data);  
 
// GR&R Calculation
export const calculateGRR = (data) => api.post('/grr/calculate', data).then(r => r.data);  
export const recalculateGRR = (id) => api.post(`/grr/${id}/recalculate`).then(r => r.data);  
 
// GR&R Queries
export const getGRRStudiesByGage = (gageId) => api.get(`/grr/gage/${gageId}`).then(r => r.data);  
export const getGRRStudiesByStatus = (status) => api.get(`/grr/status/${status}`).then(r => r.data);  
export const searchGRRStudies = (query) => api.get(`/grr/search?query=${encodeURIComponent(query)}`).then(r => r.data);  
export const getGRRStudiesByDateRange = (startDate, endDate) =>
  api.get(`/grr/date-range?startDate=${startDate}&endDate=${endDate}`).then(r => r.data);  
 
// GR&R Statistics
export const getGRRStatistics = () => api.get('/grr/statistics').then(r => r.data);  
export const getRecentGRRStudies = (limit = 10) => api.get(`/grr/recent?limit=${limit}`).then(r => r.data);  
 
// GR&R Validation
export const validateGRRData = (data) => api.post('/grr/validate', data).then(r => r.data);  
 
// GR&R Reports
export const generateGRRReport = (id) =>
  api.get(`/grr/${id}/report`, { responseType: 'blob' }).then(r => r.data);  
 
// GR&R Enums
export const getGRRStudyStatuses = () => api.get('/grr/enums/study-statuses').then(r => r.data);  
 
// GR&R Health Check
export const checkGRRHealth = () => api.get('/grr/health').then(r => r.data);
// Existing Forum API functions with error handling
export const createForumGroup = (groupData) => api.post('/forum/groups', groupData).then(r => r.data).catch(() => ({ success: false }));
export const deleteForumGroup = (groupId) => api.delete(`/forum/groups/${groupId}`).then(r => r.data).catch(() => ({ success: false }));
export const updateForumGroup = (groupId, updates) => api.put(`/forum/groups/${groupId}`, updates).then(r => r.data).catch(() => ({ success: false }));
export const fetchGroupThreads = (groupId) => api.get(`/forum/groups/${encodeURIComponent(groupId)}/posts`).then(r => r.data).catch(() => []);
export const createForumPost = (groupId, postData) => api.post(`/forum/groups/${groupId}/posts`, postData).then(r => r.data).catch(() => ({ success: false }));
export const fetchAllGroups = () => api.get('/forum/groups/all').then(r => r.data).catch(() => []);
export const fetchUserGroups = (username) => api.get('/forum/groups', { params: { username } }).then(r => r.data).catch(() => []);
export const downloadForumAttachment = (attachmentId, responseType = 'blob') =>
  api.get(`/forum/attachments/${attachmentId}`, { responseType }).then(r => r.data).catch(() => null);

export default {
  // Users
  getUsers,
  createUser,
  updateUser,
  toggleUserActive,
  
  // Bulk Upload
  bulkUploadUsers,
  downloadBulkTemplate,
  
  // Departments
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentActive,
  
  // Functions
  getFunctions,
  createFunction,
  updateFunction,
  toggleFunctionActive,
  
  // Operations
  getOperations,
  createOperation,
  updateOperation,
  toggleOperationActive,
  
  // Roles
  getRoles,
  createRole,
  updateRole,
  toggleRoleActive,
  
  // Gage Issues
  createGageIssue,
  listGageIssues,
  countGageIssues,
  updateGageIssueAllocation,
  
  // Gage Barcode Scanning
  scanGageByBarcode,
  scanGageByBarcodeImage,
  
  // Operator-filtered Gage Issues
  getOperatorFilteredGageIssues,
  getOperatorFilteredGageIssuesByPriority,
  
  // Gages
  getGages,
  getGageBySerial,
  
  // Gage Usage Operations
  validateGageForUsage,
  recordGageUsage,
  getGagesByType,
  getAvailableGageTypes,
  
  // Inventory/Reference Data
  getManufacturers,
  getServiceProviders,
  getAllGageTypes,
  
  // Jobs
  getJobs,
  createJob,
  createJobWithGageUsage,
  updateJob,
  getJobById,
  getJobByJobNumber,
  deleteJob,
  countJobs,
  
  // Operator-filtered Jobs
  getOperatorFilteredJobs,
  getOperatorFilteredJobsByPriority,
  
  // Job Usage Tracking
  getJobsByGageSerialNumber,
  getUsageRecordsByOperator,
  getTotalUsesForGage,
  getTotalDaysUsedForGage,
  
  // Mail
  sendMail,
  
  // Reallocation System
  createReallocateRequest,
  getReallocates,
  getReallocateById,
  updateReallocate,
  deleteReallocate,
  
  // Reallocation Approval Operations
  approveReallocateRequest,
  rejectReallocateRequest,
  cancelReallocateRequest,
  
  // Reallocation Return Operations
  returnGage,
  forceReturnGage,
  
  // Reallocation Query Operations
  getReallocatesByStatus,
  getReallocatesByRequester,
  getReallocatesByApprover,
  getReallocatesByDepartment,
  getReallocatesByFunction,
  getReallocatesByOperation,
  getReallocatesByGageId,
  getReallocatesByGageSerialNumber,
  
  // Reallocation Filter Operations
  getFilteredReallocates,
  getUserInvolvedReallocates,
  
  // Reallocation Time-based Operations
  getExpiredReallocates,
  getReallocatesExpiringSoon,
  processExpiredReallocation,
  
  // Reallocation Statistics
  countActiveReallocationsByDepartment,
  countPendingApprovals,
  getReallocatesByTimeLimit,
  
  // Reallocation Validation
  isGageAvailableForReallocation,
  canUserRequestReallocation,
  
  // Reallocation Admin Operations
  processAllExpiredReallocations,
  sendExpirationNotifications,
  
  // Reallocation History
  getCompletedReallocationsForGage,
  getReallocationHistoryForOperator,
  
  // Reallocation Enum Endpoints
  getReallocateStatuses,
  getReallocateTimeLimits,
  getGRRStudies,
  getGRRStudyById,
  createGRRStudy,
  updateGRRStudy,
  deleteGRRStudy,
  calculateGRR,
  recalculateGRR,
  getGRRStudiesByGage,
  getGRRStudiesByStatus,
  searchGRRStudies,
  getGRRStudiesByDateRange,
  getGRRStatistics,
  getRecentGRRStudies,
  validateGRRData,
  generateGRRReport,
  getGRRStudyStatuses,
  checkGRRHealth,
  // Forum APIs
  sendCallNotification,
  checkActiveCalls,
  createForumGroup,
  deleteForumGroup,
  updateForumGroup,
  fetchGroupThreads,
  createForumPost,
  fetchAllGroups,
  fetchUserGroups,
  downloadForumAttachment,
};