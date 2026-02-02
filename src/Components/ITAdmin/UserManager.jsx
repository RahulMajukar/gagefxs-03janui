import React, { useState, useEffect } from "react";
import InputField from "../../form/InputField";
import Button from "../../ui/Button";
import {
  getUsers,
  createUser,
  toggleUserActive,
  getDepartments,
  getFunctions,
  getOperations,
  getRoles,
  bulkUploadUsers,
  downloadBulkTemplate,
} from "../../api/api";

// Role label helpers
import { getRoleLabel, normalizeRoleKey } from "../../utils/roleUtils";

// Group Management Modal
import GroupManagementModal from "../../Components/forum/GroupManagementModal";

// === Updated to match backend enums ===
const LOCATION_OPTIONS = [
  { value: "BENGALURU", label: "Bengaluru" },
  { value: "MUMBAI", label: "Mumbai" },
  { value: "KOLKATA", label: "Kolkata" },
  { value: "CHENNAI", label: "Chennai" },
  { value: "HYDERABAD", label: "Hyderabad" },
];

const AREA_OPTIONS = [
  { value: "EAST", label: "East" },
  { value: "WEST", label: "West" },
  { value: "NORTH", label: "North" },
  { value: "SOUTH", label: "South" },
];

const PLANT_OPTIONS = [
  { value: "PLANT_A", label: "Plant A" },
  { value: "PLANT_B", label: "Plant B" },
  { value: "PLANT_C", label: "Plant C" },
];

// LocalStorage keys
const LOCAL_STORAGE_KEYS = {
  USERS: 'forum_users_cache',
  CACHE_TIMESTAMP: 'forum_users_cache_timestamp',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
};

// Helper functions for localStorage
const getCachedUsers = () => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < LOCAL_STORAGE_KEYS.CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return null;
};

const setCachedUsers = (users) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

const clearUserCache = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USERS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

const UserManager = ({
  users = [],
  departments = [],
  functions = [],
  operations = [],
  roles = [],
  onUsersChange,
}) => {
  const [usersList, setUsersList] = useState(
    users.map((u) => ({
      ...u,
      isActive: u?.isActive ?? u?.active ?? true,
      email: u?.email ?? u?.username ?? "",
      role: typeof u?.role === "string" ? { name: u.role } : u.role,
      departments: Array.isArray(u?.departments)
        ? u.departments.map((d) => (typeof d === "string" ? { name: d } : d))
        : [],
      functions: Array.isArray(u?.functions)
        ? u.functions.map((f) => (typeof f === "string" ? { name: f } : f))
        : [],
      operations: Array.isArray(u?.operations)
        ? u.operations.map((o) => (typeof o === "string" ? { name: o } : o))
        : [],
      profileImage: u?.profileImage || "",
    }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deptOptions, setDeptOptions] = useState(departments);
  const [funcOptions, setFuncOptions] = useState(functions);
  const [opOptions, setOpOptions] = useState(operations);
  const [roleOptions, setRoleOptions] = useState(roles);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    countryCode: "+91",
    phone: "",
    departmentIds: [],
    functionIds: [],
    operationIds: [],
    roleId: "",
    profileImage: "",
    adminSetsPassword: false,
    password: "",
    // New fields
    location: "",
    plant: "",
    area: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchText, setSearchText] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [tooltip, setTooltip] = useState({ show: false, message: "", x: 0, y: 0 });
  
  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  // Group Management states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [transformedUsers, setTransformedUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const normalizeUser = (u) => ({
    ...u,
    isActive: u?.isActive ?? u?.active ?? true,
    email: u?.email ?? u?.username ?? "",
    role: typeof u?.role === "string" ? { name: u.role } : u.role,
    departments: Array.isArray(u?.departments)
      ? u.departments.map((d) => (typeof d === "string" ? { name: d } : d))
      : [],
    functions: Array.isArray(u?.functions)
      ? u.functions.map((f) => (typeof f === "string" ? { name: f } : f))
      : [],
    operations: Array.isArray(u?.operations)
      ? u.operations.map((o) => (typeof o === "string" ? { name: o } : o))
      : [],
    profileImage: u?.profileImage || "",
  });

  // Transform users for GroupManagementModal
  const transformUsersForGroupModal = (usersList) => {
    return usersList.map(user => ({
      userId: user.id,
      username: user.username,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || user.username,
      department: user.departments?.map(d => d.name).join(', ') || '',
      role: user.role?.name || (typeof user.role === 'string' ? user.role : ''),
      function: user.functions?.map(f => f.name).join(', ') || '',
      operation: user.operations?.map(o => o.name).join(', ') || '',
      profileImage: user.profileImage,
      profileIcon: user.profileImage,
      phone: user.phone,
      countryCode: user.countryCode,
      isActive: user.isActive,
      location: user.location,
      plant: user.plant,
      area: user.area
    }));
  };

  // Update transformed users when usersList changes
  useEffect(() => {
    const transformed = transformUsersForGroupModal(usersList);
    setTransformedUsers(transformed);
    
    // Cache transformed users for GroupManagementModal
    try {
      localStorage.setItem('group_modal_users_cache', JSON.stringify(transformed));
    } catch (error) {
      console.error('Error caching users for group modal:', error);
    }
  }, [usersList]);

  // Load users with caching
  const loadUsers = async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedUsers = getCachedUsers();
        if (cachedUsers) {
          console.log('Loading users from cache');
          const normalized = cachedUsers.map(normalizeUser);
          setUsersList(normalized);
          return;
        }
      }
      
      // Fetch from API if no cache or forced refresh
      console.log('Fetching users from API');
      const list = await getUsers();
      const normalized = Array.isArray(list) ? list.map(normalizeUser) : [];
      
      // Update state
      setUsersList(normalized);
      
      // Cache the results
      setCachedUsers(list || []);
      
    } catch (error) {
      console.error("Error loading users:", error);
      
      // Fallback to cached data on error
      const cachedUsers = getCachedUsers();
      if (cachedUsers) {
        const normalized = cachedUsers.map(normalizeUser);
        setUsersList(normalized);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setDeptOptions(departments);
    setFuncOptions(functions);
    setOpOptions(operations);
    setRoleOptions(roles);
  }, [departments, functions, operations, roles]);

  const refreshOptions = async () => {
    try {
      const [d, f, o, r] = await Promise.all([
        getDepartments(),
        getFunctions(),
        getOperations(),
        getRoles(),
      ]);
      setDeptOptions(Array.isArray(d) ? d : []);
      setFuncOptions(Array.isArray(f) ? f : []);
      setOpOptions(Array.isArray(o) ? o : []);
      setRoleOptions(Array.isArray(r) ? r : []);
    } catch (_) {}
  };

  useEffect(() => {
    if (showAddForm) {
      refreshOptions();
    }
  }, [showAddForm]);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      countryCode: "+91",
      phone: "",
      departmentIds: [],
      functionIds: [],
      operationIds: [],
      roleId: "",
      profileImage: "",
      adminSetsPassword: false,
      password: "",
      // Reset new fields
      location: "",
      plant: "",
      area: "",
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (
      formData.email &&
      formData.email.trim() &&
      !/\S+@\S+\.\S+/.test(formData.email)
    ) {
      errors.email = "Email is invalid";
    }
    if (formData.adminSetsPassword && !formData.password.trim()) {
      errors.password = "Password is required when admin sets it";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!/^\d{7,15}$/.test(formData.phone.trim())) {
      errors.phone = "Enter 7–15 digits";
    }
    if (formData.departmentIds.length === 0)
      errors.departmentIds = "At least one department is required";
    if (!formData.roleId) errors.roleId = "Role is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      let updates = { ...prev, [field]: value };

      // Reset dependent fields
      if (field === "location") {
        updates.area = "";
        updates.plant = "";
      } else if (field === "area") {
        updates.plant = "";
      }

      return updates;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleToggleSelection = (field, id) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((item) => item !== id)
        : [...prev[field], id],
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        countryCode: formData.countryCode,
        phone: formData.phone.trim(),
        roleId: formData.roleId,
        departmentIds: formData.departmentIds,
        functionIds: formData.functionIds,
        operationIds: formData.operationIds,
        profileImage: formData.profileImage || undefined,
        adminSetsPassword: formData.adminSetsPassword,
        password: formData.adminSetsPassword ? formData.password : undefined,
        // Include new fields
        location: formData.location || undefined,
        plant: formData.plant || undefined,
        area: formData.area || undefined,
      };
      console.log("Creating user with payload:", payload);
      console.log("Profile image data:", formData.profileImage ? "Present" : "Not present");
      await createUser(payload);
      
      // Refresh users and clear cache to force reload from API
      clearUserCache();
      await loadUsers(true);
      
      onUsersChange?.(usersList);
      setSuccessMessage("User created successfully!");
      setShowSuccessPopup(true);
      resetForm();
      setShowAddForm(false);
    } catch (e) {
      console.error("Error creating user:", e);
      const msg =
        e?.response?.status === 409
          ? "User already exists"
          : e?.response?.data || "Failed to create user";
      setFormErrors((prev) => ({ ...prev, username: msg }));
    }
  };

  const handleProfileImageChange = (file) => {
    if (!file) {
      console.log("No file selected, clearing profile image");
      handleInputChange("profileImage", "");
      return;
    }
    console.log("File selected for profile image:", file.name, file.size, "bytes");
    const reader = new FileReader();
    reader.onload = () => {
      console.log("Profile image loaded, data URL length:", reader.result.length);
      handleInputChange("profileImage", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    const findMatchingIds = (userItems, availableOptions) => {
      if (!userItems || !Array.isArray(userItems)) return [];
      return userItems
        .map(userItem => {
          const found = availableOptions.find(option => 
            option.id === userItem.id || 
            option.name === userItem.name ||
            option.id === userItem ||
            option.name === userItem
          );
          return found?.id;
        })
        .filter(Boolean);
    };
    const currentDeptOptions = deptOptions.length > 0 ? deptOptions : departments;
    const currentFuncOptions = funcOptions.length > 0 ? funcOptions : functions;
    const currentOpOptions = opOptions.length > 0 ? opOptions : operations;
    const currentRoleOptions = roleOptions.length > 0 ? roleOptions : roles;
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || user.username || "",
      countryCode: user.countryCode || "+91",
      phone: user.phone || "",
      departmentIds: findMatchingIds(user.departments, currentDeptOptions),
      functionIds: findMatchingIds(user.functions, currentFuncOptions),
      operationIds: findMatchingIds(user.operations, currentOpOptions),
      roleId: (() => {
        const userRole = user.role;
        if (!userRole) return "";
        const foundRole = currentRoleOptions.find(role => 
          role.id === userRole.id || 
          role.name === userRole.name ||
          role.id === userRole ||
          role.name === userRole
        );
        return foundRole?.id || "";
      })(),
      profileImage: user.profileImage || "",
      adminSetsPassword: false,
      password: "",
      location: user.location || "",
      plant: user.plant || "",
      area: user.area || "",
    });
    setShowAddForm(true);
  };

  const handleUpdateUser = () => {
    if (!validateForm()) return;
    const updatedList = usersList.map((user) =>
      user.id === editingUser.id
        ? {
            ...user,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            countryCode: formData.countryCode,
            phone: formData.phone.trim(),
            departments: deptOptions.filter((d) =>
              formData.departmentIds.includes(d.id)
            ),
            functions: funcOptions.filter((f) =>
              formData.functionIds.includes(f.id)
            ),
            operations: opOptions.filter((op) =>
              formData.operationIds.includes(op.id)
            ),
            role: roleOptions.find((r) => r.id === formData.roleId),
            profileImage: formData.profileImage,
            location: formData.location,
            plant: formData.plant,
            area: formData.area,
          }
        : user
    );
    setUsersList(updatedList);
    
    // Update cache with modified user
    const cachedUsers = getCachedUsers();
    if (cachedUsers) {
      const updatedCache = cachedUsers.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...updatedList.find(user => user.id === editingUser.id) }
          : u
      );
      setCachedUsers(updatedCache);
    }
    
    onUsersChange?.(updatedList);
    setSuccessMessage("User updated successfully!");
    setShowSuccessPopup(true);
    resetForm();
    setEditingUser(null);
    setShowAddForm(false);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const current = usersList.find((u) => u.id === userId);
      const currentActive = Boolean(current?.isActive ?? current?.active);
      await toggleUserActive(userId, !currentActive);
      
      // Refresh users and clear cache
      clearUserCache();
      await loadUsers(true);
      
      onUsersChange?.(usersList);
    } catch (_) {}
  };

  const handleCancel = () => {
    resetForm();
    setEditingUser(null);
    setShowAddForm(false);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  // Bulk Upload Functions
  const handleBulkFileUpload = async (event) => {
    const file = event.target.files[0];
    console.log("File selected:", file);

    if (!file) {
      console.log("No file selected");
      return;
    }

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
    ];
    
    const isValidType = validTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.xlsx') || 
                       file.name.toLowerCase().endsWith('.xls') || 
                       file.name.toLowerCase().endsWith('.csv');
    
    if (!isValidType) {
      setUploadError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      setSelectedFileName('');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      setSelectedFileName('');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    setSelectedFileName(file.name);

    try {
      console.log("Starting bulk upload...");
      const response = await bulkUploadUsers(file);
      console.log("Upload response:", response);
      setUploadResult(response);
      
      // Refresh users list after successful upload and clear cache
      if (response.successfulImports > 0) {
        clearUserCache();
        await loadUsers(true);
        onUsersChange?.(usersList);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || 'Upload failed. Please check the file format and try again.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadBulkTemplate();
    } catch (err) {
      setUploadError('Failed to download template');
    }
  };

  const handleCloseBulkUpload = () => {
    setShowBulkUpload(false);
    setUploadResult(null);
    setUploadError('');
    setSelectedFileName('');
  };

  // Manual file trigger function
  const triggerFileInput = () => {
    const fileInput = document.getElementById('bulk-upload-file');
    if (fileInput) {
      fileInput.click();
    }
  };

  // Group Management Functions
  const fetchGroups = async () => {
    try {
      // You'll need to implement this API call
      // const response = await getGroups();
      // setGroups(response);
      console.log("Fetch groups - Implement API call");
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      // You'll need to implement this API call
      // const response = await createGroup(groupData);
      // setGroups(prev => [...prev, response]);
      console.log("Create group:", groupData);
      alert("Group created successfully! (API call needs implementation)");
      return { success: true };
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    try {
      // You'll need to implement this API call
      // const response = await updateGroup(groupId, updates);
      // setGroups(prev => prev.map(g => g.groupId === groupId ? response : g));
      console.log("Update group:", groupId, updates);
      alert("Group updated successfully! (API call needs implementation)");
      return { success: true };
    } catch (error) {
      console.error("Error updating group:", error);
      throw error;
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      // You'll need to implement this API call
      // await deleteGroup(groupId);
      // setGroups(prev => prev.filter(g => g.groupId !== groupId));
      console.log("Delete group:", groupId);
      alert("Group deleted successfully! (API call needs implementation)");
      return { success: true };
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  };

  // Only show users with roles: IT_ADMIN, ROLE_CALIBRATION_MANAGER, ROLE_ADMIN (and equivalent variants)
  const allowedRolesNormalized = new Set(["IT_ADMIN", "ADMIN", "CALIBRATION_MANAGER",]);

  const filteredUsers = React.useMemo(() => {
    const q = (searchText || "").trim().toLowerCase();
    const qDigits = searchText.replace(/\D/g, "");

    return usersList
      .filter((u) => {
        // Normalize role for comparison (handles ROLE_ prefix and case)
        const roleName = u.role?.name || (typeof u.role === 'string' ? u.role : "");
        const normalized = normalizeRoleKey(roleName);
        return allowedRolesNormalized.has(normalized);
      })
      .filter((u) => {
        // apply search filter
        if (!q) return true;
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
        const username = (u.username || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phoneDigits = String(u.phone || "").replace(/\D/g, "");
        return (
          name.includes(q) ||
          username.includes(q) ||
          email.includes(q) ||
          (qDigits && phoneDigits.includes(qDigits))
        );
      });
  }, [usersList, searchText]);

  // Show tooltip on click of disabled mimic
  const showTooltip = (message, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      message,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY,
    });
    setTimeout(() => setTooltip({ show: false, message: "", x: 0, y: 0 }), 2000);
  };

  // Refresh users manually
  const handleRefreshUsers = () => {
    clearUserCache();
    loadUsers(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <p className="text-blue-100 mt-1 text-sm">
              Manage user accounts, roles, and access permissions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={handleRefreshUsers}
              variant="outline"
              size="medium"
              className="w-full sm:w-auto px-4 py-2.5 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              title="Refresh users from server"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            <Button
              onClick={() => setShowGroupModal(true)}
              variant="outline"
              size="medium"
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Groups
            </Button>
            <Button
              onClick={() => setShowBulkUpload(true)}
              variant="outline"
              size="medium"
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Bulk Upload
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              variant="primary"
              size="medium"
              className="w-full sm:w-auto px-5 py-2.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <div className="border-b border-gray-200 px-6 py-4 bg-blue-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Bulk User Upload</h3>
            <button
              onClick={handleCloseBulkUpload}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Upload Section - FIXED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel/CSV File
              </label>
              
              {/* Hidden file input */}
              <input
                id="bulk-upload-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleBulkFileUpload}
                disabled={uploading}
                className="hidden"
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Custom file upload button */}
                <div className="flex-1">
                  <div 
                    onClick={uploading ? undefined : triggerFileInput}
                    className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                      uploading 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                        : 'border-blue-300 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        {selectedFileName ? selectedFileName : 'Click to select file or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Excel (.xlsx, .xls) or CSV, max 10MB
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="medium"
                  className="whitespace-nowrap"
                  disabled={uploading}
                >
                  Download Template
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
            )}

            {/* Upload Results */}
            {uploadResult && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Upload Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium">Total Records:</span> {uploadResult.totalRecords}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">Successful:</span> {uploadResult.successfulImports}
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">Failed:</span> {uploadResult.failedImports}
                  </div>
                </div>
                
                {/* Errors List */}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-gray-700 mb-1">Errors:</h5>
                    <div className="max-h-32 overflow-y-auto text-xs bg-white p-2 rounded border">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-red-600 py-1 border-b border-gray-200 last:border-b-0">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uploading Indicator */}
            {uploading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700 text-sm flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing upload... This may take a moment for large files.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">File Format Instructions:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• <strong>Required fields:</strong> username, firstName, lastName</li>
                <li>• <strong>Username must be unique</strong> across the system</li>
                <li>• <strong>Enums:</strong> location, area, plant must match exact values (BENGALURU, MUMBAI, etc.)</li>
                <li>• <strong>Relationships:</strong> departments, functions, operations should be comma-separated exact names</li>
                <li>• <strong>Password:</strong> Leave empty for auto-generation and email delivery</li>
                <li>• <strong>Role:</strong> Provide exact role name (ROLE_USER, ROLE_ADMIN, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Current Users</h3>
              <p className="text-xs text-gray-500 mt-1">
                {usersList.length} users loaded • Cached for 5 minutes
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <InputField
                type="text"
                placeholder="Search by name, username, email, or phone"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full sm:w-72"
              />
              <Button
                onClick={clearSearch}
                variant="secondary"
                size="medium"
                className="w-auto px-4"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {usersList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-3">No users found</p>
            <Button
              onClick={handleRefreshUsers}
              variant="outline"
              size="small"
              className="mt-4"
            >
              Try loading again
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departments</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Functions</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operations</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={user.isActive ? "hover:bg-gray-50" : "bg-gray-50 opacity-75"}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border"
                              src={user.profileImage}
                              alt="Profile"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${user.isActive ? "text-indigo-700" : "text-gray-500"}`}>
                            {user.email || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 whitespace-nowrap text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td className={`px-5 py-4 whitespace-nowrap text-sm font-mono ${user.isActive ? "text-blue-700" : "text-gray-500"}`}>
                      {user.username}
                    </td>
                    <td className={`px-5 py-4 whitespace-nowrap text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {user.countryCode} {user.phone || "-"}
                    </td>
                    <td className={`px-5 py-4 text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {user.departments?.map((d) => d.name).join(", ") || "-"}
                    </td>
                    <td className={`px-5 py-4 whitespace-nowrap text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {getRoleLabel(user.role?.name || (typeof user.role === 'string' ? user.role : '')) || "-"}
                    </td>
                    <td className={`px-5 py-4 text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {user.functions?.map((f) => f.name).join(", ") || "-"}
                    </td>
                    <td className={`px-5 py-4 text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {user.operations?.map((op) => op.name).join(", ") || "-"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          size="small"
                          className="w-auto px-3 py-1.5 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleToggleStatus(user.id)}
                          variant={user.isActive ? "danger" : "success"}
                          size="small"
                          className="w-auto px-3 py-1.5"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit User */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingUser ? "Edit User" : "Create User"}
                </h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-lg">?</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProfileImageChange(e.target.files?.[0])}
                    className="block text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <InputField
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      error={formErrors.firstName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <InputField
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      error={formErrors.lastName}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <InputField
                    type="text"
                    placeholder="Enter username (must be unique)"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    error={formErrors.username}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                  <InputField
                    type="email"
                    placeholder="Used for password delivery"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    error={formErrors.email}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, temporary password will be emailed (unless admin sets password).
                  </p>
                </div>
                {/* Password Policy */}
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="flex items-start gap-3 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.adminSetsPassword}
                      onChange={(e) => handleInputChange("adminSetsPassword", e.target.checked)}
                      className="mt-0.5 rounded text-yellow-600 focus:ring-yellow-500"
                    />
                    <span>
                      <strong>Admin sets password</strong> – if unchecked, a temporary password will be emailed to the user.
                    </span>
                  </label>
                  {formData.adminSetsPassword && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                      <InputField
                        type="password"
                        placeholder="Enter secure password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        error={formErrors.password}
                      />
                    </div>
                  )}
                </div>
                {/* Phone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange("countryCode", e.target.value)}
                    >
                      <option value="+91">🇮🇳 +91 (India)</option>
                      <option value="+1">🇺🇸 +1 (USA)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+86">🇨🇳 +86 (China)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <InputField
                      type="tel"
                      placeholder="Enter 7–15 digits"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value.replace(/[^\d]/g, ""))}
                      error={formErrors.phone}
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
              {/* Organization */}
              <div className="bg-green-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departments *</label>
                  <div className="max-h-32 overflow-y-auto p-2 bg-white border border-gray-300 rounded-lg">
                    {deptOptions.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-3 p-2 hover:bg-green-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.departmentIds.includes(dept.id)}
                          onChange={() => handleToggleSelection("departmentIds", dept.id)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.departmentIds && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.departmentIds}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    className={`w-full border rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-green-500 ${
                      formErrors.roleId ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.roleId}
                    onChange={(e) => handleInputChange("roleId", e.target.value)}
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {getRoleLabel(role.name || (typeof role === 'string' ? role : ''))}
                      </option>
                    ))}
                  </select>
                  {formErrors.roleId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.roleId}</p>
                  )}
                </div>
              </div>
              {/* Permissions */}
              <div className="bg-purple-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Functions</label>
                    <div className="max-h-28 overflow-y-auto p-2 bg-white border border-gray-300 rounded-lg">
                      {funcOptions.map((func) => (
                        <label
                          key={func.id}
                          className="flex items-center gap-3 p-2 hover:bg-purple-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.functionIds.includes(func.id)}
                            onChange={() => handleToggleSelection("functionIds", func.id)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{func.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operations</label>
                    <div className="max-h-28 overflow-y-auto p-2 bg-white border border-gray-300 rounded-lg">
                      {opOptions.map((op) => (
                        <label
                          key={op.id}
                          className="flex items-center gap-3 p-2 hover:bg-purple-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.operationIds.includes(op.id)}
                            onChange={() => handleToggleSelection("operationIds", op.id)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{op.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Location Details Section */}
              <div className="bg-blue-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                    >
                      <option value="">Select Location</option>
                      {LOCATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area: contextual display, raw value saved */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                    {formData.location ? (
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.area}
                        onChange={(e) => handleInputChange("area", e.target.value)}
                      >
                        <option value="">Select Area</option>
                        {AREA_OPTIONS.map((opt) => {
                          const locationLabel = LOCATION_OPTIONS.find(l => l.value === formData.location)?.label || formData.location;
                          const displayLabel = `${opt.label} (${locationLabel})`;
                          return (
                            <option key={opt.value} value={opt.value}>
                              {displayLabel}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div
                        onClick={(e) => showTooltip("Please select a Location first.", e)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-gray-400 cursor-not-allowed"
                        style={{ userSelect: 'none' }}
                      >
                        Select Area
                      </div>
                    )}
                  </div>

                  {/* Plant: enabled only after Area is selected */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plant</label>
                    {formData.area ? (
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.plant}
                        onChange={(e) => handleInputChange("plant", e.target.value)}
                      >
                        <option value="">Select Plant</option>
                        {PLANT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        onClick={(e) => showTooltip("Please select an Area first.", e)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-gray-400 cursor-not-allowed"
                        style={{ userSelect: 'none' }}
                      >
                        Select Plant
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="medium"
                className="px-5 py-2.5"
              >
                Cancel
              </Button>
              <Button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                variant="primary"
                size="medium"
                className="px-5 py-2.5"
                disabled={Object.keys(formErrors).some((key) => formErrors[key])}
              >
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Group Management Modal */}
      {showGroupModal && (
        <GroupManagementModal
          isOpen={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          users={transformedUsers}
          groups={groups}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onUpdateGroup={handleUpdateGroup}
        />
      )}

      {/* Tooltip Popup */}
      {tooltip.show && (
        <div
          className="fixed bg-red-500 text-white text-sm px-3 py-2 rounded shadow-lg z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 40}px`,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.message}
        </div>
      )}
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 mb-4">{successMessage}</p>
            <Button
              onClick={() => setShowSuccessPopup(false)}
              variant="primary"
              size="medium"
              className="w-full"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;