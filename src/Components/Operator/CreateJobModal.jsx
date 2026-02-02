import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import {
  ClipboardList,
  CalendarDays,
  User,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  MapPin,
  FileText,
  Wrench,
  Package,
} from "lucide-react";
import { createJob, getDepartments, getFunctions, getOperations, getAvailableGageTypes, getGagesByType } from "../../api/api";
import { useAuth } from "../../auth/AuthContext";

export default function CreateJobModal({ isOpen, onClose, onSubmit }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    jobNumber: "",
    jobDescription: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
    startDate: "",
    endDate: "",
    department: "",
    functionName: "",
    operationName: "",
    estimatedDuration: "",
    location: "",
    notes: "",
    // Gage usage fields
    gageType: "",
    gageSerialNumber: "",
    daysUsed: "",
    usesCount: "",
    usageCount: "",
    usageNotes: "",
  });

  const [departments, setDepartments] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [availableGageTypes, setAvailableGageTypes] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [includeGageUsage, setIncludeGageUsage] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deps, funcs, ops, gageTypes] = await Promise.all([
        getDepartments().catch(() => []),
        getFunctions().catch(() => []),
        getOperations().catch(() => []),
        getAvailableGageTypes().catch(() => []),
      ]);
      setDepartments(deps || []);
      setFunctions(funcs || []);
      setOperations(ops || []);
      setAvailableGageTypes(gageTypes || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      jobNumber: "",
      jobDescription: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      assignedTo: "",
      dueDate: "",
      startDate: "",
      endDate: "",
      department: user.departments && user.departments.length > 0 ? user.departments[0] : "",
      functionName: user.functions && user.functions.length > 0 ? user.functions[0] : "",
      operationName: user.operations && user.operations.length > 0 ? user.operations[0] : "",
      estimatedDuration: "",
      location: "",
      notes: "",
      // Gage usage fields
      gageType: "",
      gageSerialNumber: "",
      daysUsed: "",
      usesCount: "",
      usageCount: "",
      usageNotes: "",
    });
    setError("");
    setIncludeGageUsage(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.jobNumber || !formData.jobDescription || !formData.title) {
      setError("Please fill in all required fields (Job Number, Job Description, Title)");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const jobData = {
        jobNumber: formData.jobNumber.trim(),
        jobDescription: formData.jobDescription.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        createdBy: user.username,
        assignedTo: formData.assignedTo.trim() || null,
        dueDate: formData.dueDate || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        department: formData.department || null,
        functionName: formData.functionName || null,
        operationName: formData.operationName || null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
        // Gage usage fields (only if includeGageUsage is true)
        gageType: includeGageUsage ? formData.gageType || null : null,
        gageSerialNumber: includeGageUsage ? formData.gageSerialNumber || null : null,
        daysUsed: includeGageUsage && formData.daysUsed ? parseInt(formData.daysUsed) : null,
        usesCount: includeGageUsage && formData.usesCount ? parseInt(formData.usesCount) : null,
        operatorUsername: includeGageUsage ? user.username : null,
        operatorRole: includeGageUsage ? (user.functions && user.functions.length > 0 ? "F" : "OT") : null,
        operatorFunction: includeGageUsage ? (user.functions && user.functions.length > 0 ? user.functions[0] : null) : null,
        operatorOperation: includeGageUsage ? (user.operations && user.operations.length > 0 ? user.operations[0] : null) : null,
        usageDate: includeGageUsage ? new Date().toISOString().split('T')[0] : null,
        usageCount: includeGageUsage && formData.usageCount ? parseInt(formData.usageCount) : null,
        usageNotes: includeGageUsage ? formData.usageNotes || null : null,
        tags: [],
        attachments: [],
      };

      const result = await createJob(jobData);
      
      alert(`Job created successfully!\nJob Number: ${result.jobNumber}\nTitle: ${result.title}`);
      
      if (onSubmit) {
        onSubmit(result);
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating job:", err);
      setError("Failed to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-indigo-900/60 backdrop-blur-sm z-50 px-4 py-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Job</h2>
                <p className="text-blue-100 text-sm">Create a new job for tracking and management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span className="text-white text-xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading form data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Basic Job Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Hash className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Number *
                    </label>
                    <input
                      type="text"
                      name="jobNumber"
                      value={formData.jobNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description *
                    </label>
                    <textarea
                      name="jobDescription"
                      value={formData.jobDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the job"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional details (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
                    Scheduling & Assignment
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Username or name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration (days)
                    </label>
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Number of days"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Job location"
                    />
                  </div>
                </div>
              </div>

              {/* Department/Function/Operation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Organizational Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Function
                    </label>
                    <select
                      name="functionName"
                      value={formData.functionName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Function</option>
                      {functions.map((func) => (
                        <option key={func.id} value={func.name}>
                          {func.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation
                    </label>
                    <select
                      name="operationName"
                      value={formData.operationName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Operation</option>
                      {operations.map((op) => (
                        <option key={op.id} value={op.name}>
                          {op.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Gage Usage Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeGageUsage"
                    checked={includeGageUsage}
                    onChange={(e) => setIncludeGageUsage(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeGageUsage" className="text-sm font-medium text-gray-700 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-green-600" />
                    Include Gage Usage Information
                  </label>
                </div>

                {includeGageUsage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-lg font-semibold text-green-800 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Gage Usage Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gage Type
                        </label>
                        <select
                          name="gageType"
                          value={formData.gageType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select Gage Type</option>
                          {availableGageTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          name="gageSerialNumber"
                          value={formData.gageSerialNumber}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter serial number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days Used
                        </label>
                        <input
                          type="number"
                          name="daysUsed"
                          value={formData.daysUsed}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Number of days"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Uses Count
                        </label>
                        <input
                          type="number"
                          name="usesCount"
                          value={formData.usesCount}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Number of uses"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Items Processed
                        </label>
                        <input
                          type="number"
                          name="usageCount"
                          value={formData.usageCount}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usage Notes
                      </label>
                      <textarea
                        name="usageNotes"
                        value={formData.usageNotes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Notes about gage usage"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes or comments"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Create Job</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
