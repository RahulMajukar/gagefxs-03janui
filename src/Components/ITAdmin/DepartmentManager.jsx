import React, { useState } from "react";
import InputField from "../../form/InputField";
import Button from "../../ui/Button";
import { getDepartments, createDepartment, updateDepartment, toggleDepartmentActive } from "../../api/api";

const DepartmentManager = ({ departments = [], onDepartmentsChange }) => {
  const [departmentsList, setDepartmentsList] = useState(
    departments.map(dept => ({ ...dept, isActive: dept.isActive ?? true }))
  );
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deptForm, setDeptForm] = useState({
    name: "",
    type: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    costCenter: "",
    budget: "",
    shifts: [],
    tasks: []
  });

  const resetDeptForm = () => {
    setDeptForm({
      name: "",
      type: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      costCenter: "",
      budget: "",
      shifts: [],
      tasks: []
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingDept(null);
    resetDeptForm();
    setShowModal(true);
  };

  React.useEffect(() => {
    (async () => {
      try {
        const list = await getDepartments();
        setDepartmentsList(list);
      } catch (e) {
        // fallback to provided props
      }
    })();
  }, []);

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name || "",
      type: dept.type || "",
      contactPerson: dept.contactPerson || "",
      contactEmail: dept.contactEmail || "",
      contactPhone: dept.contactPhone || "",
      costCenter: dept.costCenter || "",
      budget: dept.budget || "",
      shifts: Array.isArray(dept.shifts) ? dept.shifts : [],
      tasks: Array.isArray(dept.tasks) ? dept.tasks : []
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!deptForm.name.trim()) errors.name = "Department name is required";
    if (!deptForm.type) errors.type = "Select department type";
    if (deptForm.contactEmail && !/\S+@\S+\.\S+/.test(deptForm.contactEmail)) {
      errors.contactEmail = "Invalid email";
    }
    if (deptForm.contactPhone && !/^\+?[- 0-9]{7,20}$/.test(deptForm.contactPhone)) {
      errors.contactPhone = "Invalid phone";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDepartment = async () => {
    if (!validateForm()) return;

    // Duplicate name check
    const nameLower = deptForm.name.trim().toLowerCase();
    const exists = departmentsList.some(d =>
      (editingDept ? d.id !== editingDept.id : true) && d.name.toLowerCase() === nameLower
    );
    if (exists) {
      setFormErrors(prev => ({ ...prev, name: "Department with this name already exists" }));
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, { ...deptForm, name: deptForm.name.trim() });
      } else {
        await createDepartment({ ...deptForm, name: deptForm.name.trim() });
      }
      const list = await getDepartments();
      setDepartmentsList(list);
      onDepartmentsChange?.(list);
    } catch (e) {
      // handle error UX as needed
    }

    setShowModal(false);
    setEditingDept(null);
    resetDeptForm();
  };

  const handleToggleStatus = async (deptId) => {
    try {
      const current = departmentsList.find(d => d.id === deptId);
      await toggleDepartmentActive(deptId, !(current?.isActive));
      const list = await getDepartments();
      setDepartmentsList(list);
      onDepartmentsChange?.(list);
    } catch (e) {}
  };

  const addShift = () => {
    const newShift = { id: `shift-${Date.now()}`, name: "", start: "", end: "" };
    setDeptForm(prev => ({ ...prev, shifts: [...prev.shifts, newShift] }));
  };

  const updateShift = (id, field, value) => {
    setDeptForm(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const removeShift = (id) => {
    setDeptForm(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) }));
  };

  const addTask = () => {
    const newTask = { id: `task-${Date.now()}`, name: "" };
    setDeptForm(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (id, value) => {
    setDeptForm(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, name: value } : t)
    }));
  };

  const removeTask = (id) => {
    setDeptForm(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Department Management</h2>
        <Button 
          onClick={openAddModal}
          variant="primary"
          size="medium"
          className="w-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Department
        </Button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#005797] text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{editingDept ? "Edit Department" : "Add Department"}</h2>
                  <p className="text-blue-100 mt-1">Department Manager</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingDept(null); }} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* General Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
                    <InputField
                      type="text"
                      placeholder="Enter department name"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                      error={formErrors.name}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Type *</label>
                    <select
                      className={`w-full border rounded-lg p-3 bg-white shadow-sm ${formErrors.type ? 'border-red-500' : 'border-gray-300'}`}
                      value={deptForm.type}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">Select Type</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Technical">Technical</option>
                      <option value="Operations">Operations</option>
                      <option value="Support">Support</option>
                    </select>
                    {formErrors.type && <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-indigo-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <InputField
                      type="text"
                      placeholder="Enter contact person"
                      value={deptForm.contactPerson}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <InputField
                      type="email"
                      placeholder="Enter email"
                      value={deptForm.contactEmail}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      error={formErrors.contactEmail}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <InputField
                      type="tel"
                      placeholder="Enter phone"
                      value={deptForm.contactPhone}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      error={formErrors.contactPhone}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="bg-green-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Center</label>
                    <InputField
                      type="text"
                      placeholder="Enter cost center"
                      value={deptForm.costCenter}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, costCenter: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                    <InputField
                      type="number"
                      placeholder="Enter budget"
                      value={deptForm.budget}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Shifts */}
              <div className="bg-yellow-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Shifts</h3>
                  <Button onClick={addShift} variant="secondary" size="small" className="w-auto">+ Add Shift</Button>
                </div>
                {deptForm.shifts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No shifts added</p>
                ) : (
                  <div className="space-y-3">
                    {deptForm.shifts.map(shift => (
                      <div key={shift.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <InputField
                            type="text"
                            placeholder="Shift name"
                            value={shift.name}
                            onChange={(e) => updateShift(shift.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                          <InputField
                            type="time"
                            value={shift.start}
                            onChange={(e) => updateShift(shift.id, 'start', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                          <InputField
                            type="time"
                            value={shift.end}
                            onChange={(e) => updateShift(shift.id, 'end', e.target.value)}
                          />
                        </div>
                        <div className="flex">
                          <Button onClick={() => removeShift(shift.id)} variant="warning" size="small" className="w-auto ml-auto">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks / Operations */}
              <div className="bg-purple-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Tasks / Operations</h3>
                  <Button onClick={addTask} variant="secondary" size="small" className="w-auto">+ Add Task</Button>
                </div>
                {deptForm.tasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks added</p>
                ) : (
                  <div className="space-y-3">
                    {deptForm.tasks.map(task => (
                      <div key={task.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="md:col-span-5">
                          <InputField
                            type="text"
                            placeholder="Task/Operation name"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, e.target.value)}
                          />
                        </div>
                        <div className="flex">
                          <Button onClick={() => removeTask(task.id)} variant="warning" size="small" className="w-auto ml-auto">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button 
                onClick={() => { setShowModal(false); setEditingDept(null); }}
                variant="secondary"
                size="medium"
                className="w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveDepartment}
                variant="primary"
                size="medium"
                className="w-auto"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Departments List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Current Departments</h3>
        {departmentsList.length === 0 ? (
          <p className="text-gray-500 italic">No departments available</p>
        ) : (
          <div className="space-y-3">
            {departmentsList.map((dept) => (
              <div key={dept.id} className={`flex items-center justify-between p-3 border rounded-lg ${!dept.isActive ? 'bg-gray-50 border-gray-300' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-medium text-lg ${!dept.isActive ? 'opacity-40 text-gray-500' : ''}`}>{dept.name}</span>
                  {dept.type && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{dept.type}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => openEditModal(dept)}
                    variant="primary"
                    size="small"
                    className="w-auto"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleToggleStatus(dept.id)}
                    variant={dept.isActive ? "warning" : "success"}
                    size="small"
                    className="w-auto"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dept.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M5 13l4 4L19 7"} />
                    </svg>
                    {dept.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManager;
