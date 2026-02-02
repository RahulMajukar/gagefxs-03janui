import React, { useState, useEffect } from "react";
import InputField from "../../form/InputField";
import Button from "../../ui/Button";
import { getOperations, createOperation, updateOperation, toggleOperationActive } from "../../api/api";

const OperationManager = ({ operations = [], functions = [], onOperationsChange }) => {
  const [operationsList, setOperationsList] = useState(
    operations.map(op => ({ ...op, isActive: op.isActive ?? true }))
  );
  const [showModal, setShowModal] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [opForm, setOpForm] = useState({
    name: "",
    code: "",
    description: "",
    functionIds: [],
    estimatedTimeMin: "",
    requiredSkills: "",
    isMandatory: false
  });

  const resetOpForm = () => {
    setOpForm({
      name: "",
      code: "",
      description: "",
      functionIds: [],
      estimatedTimeMin: "",
      requiredSkills: "",
      isMandatory: false
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingOp(null);
    resetOpForm();
    setShowModal(true);
  };

  React.useEffect(() => {
    (async () => {
      try {
        const list = await getOperations();
        setOperationsList(list);
      } catch (e) {}
    })();
  }, []);

  const openEditModal = (op) => {
    setEditingOp(op);
    setOpForm({
      name: op.name || "",
      code: op.code || "",
      description: op.description || "",
      functionIds: Array.isArray(op.functionIds) ? op.functionIds : (op.functions?.map(f => f.id) || []),
      estimatedTimeMin: op.estimatedTimeMin?.toString() || "",
      requiredSkills: op.requiredSkills || "",
      isMandatory: !!op.isMandatory
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!opForm.name.trim()) errors.name = "Operation name is required";
    if (opForm.code && !/^[A-Za-z0-9_-]{2,15}$/.test(opForm.code)) errors.code = "Use 2-15 letters, numbers, - or _";
    if (opForm.estimatedTimeMin && Number.isNaN(Number(opForm.estimatedTimeMin))) errors.estimatedTimeMin = "Must be a number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleFunction = (id) => {
    setOpForm(prev => ({
      ...prev,
      functionIds: prev.functionIds.includes(id)
        ? prev.functionIds.filter(x => x !== id)
        : [...prev.functionIds, id]
    }));
  };

  const saveOperation = async () => {
    if (!validateForm()) return;

    const nameLower = opForm.name.trim().toLowerCase();
    const exists = operationsList.some(o =>
      (editingOp ? o.id !== editingOp.id : true) && o.name.toLowerCase() === nameLower
    );
    if (exists) {
      setFormErrors(prev => ({ ...prev, name: "Operation with this name already exists" }));
      return;
    }
    
    try {
      if (editingOp) {
        await updateOperation(editingOp.id, { ...opForm, name: opForm.name.trim() });
      } else {
        await createOperation({ ...opForm, name: opForm.name.trim() });
      }
      const list = await getOperations();
      setOperationsList(list);
      onOperationsChange?.(list);
    } catch (e) {}

    setShowModal(false);
    setEditingOp(null);
    resetOpForm();
  };

  const handleToggleStatus = async (opId) => {
    try {
      const current = operationsList.find(op => op.id === opId);
      await toggleOperationActive(opId, !(current?.isActive));
      const list = await getOperations();
      setOperationsList(list);
      onOperationsChange?.(list);
    } catch (e) {}
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-700">Operation Management</h2>
        <Button onClick={openAddModal} variant="primary" size="medium" className="w-auto">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Operation
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#005797] text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{editingOp ? "Edit Operation" : "Add Operation"}</h2>
                  <p className="text-purple-100 mt-1">Operation details</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingOp(null); }} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation Name *</label>
          <InputField
            type="text"
            placeholder="Enter operation name"
                      value={opForm.name}
                      onChange={(e) => setOpForm(prev => ({ ...prev, name: e.target.value }))}
                      error={formErrors.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                    <InputField
                      type="text"
                      placeholder="e.g. OP-01"
                      value={opForm.code}
                      onChange={(e) => setOpForm(prev => ({ ...prev, code: e.target.value }))}
                      error={formErrors.code}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <InputField
                    type="text"
                    placeholder="Enter description"
                    value={opForm.description}
                    onChange={(e) => setOpForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Associations REMOVED as requested */}

              <div className="bg-rose-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Constraints</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (min)</label>
                    <InputField
                      type="number"
                      placeholder="e.g. 30"
                      value={opForm.estimatedTimeMin}
                      onChange={(e) => setOpForm(prev => ({ ...prev, estimatedTimeMin: e.target.value }))}
                      error={formErrors.estimatedTimeMin}
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <InputField
                      type="text"
                      placeholder="Comma-separated skills"
                      value={opForm.requiredSkills}
                      onChange={(e) => setOpForm(prev => ({ ...prev, requiredSkills: e.target.value }))}
                    />
                  </div>
                  {/* Is Mandatory checkbox REMOVED as requested */}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button onClick={() => { setShowModal(false); setEditingOp(null); }} variant="secondary" size="medium" className="w-auto">Cancel</Button>
              <Button onClick={saveOperation} variant="primary" size="medium" className="w-auto">Save</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Current Operations</h3>
        {operationsList.length === 0 ? (
          <p className="text-gray-500 italic">No operations available</p>
        ) : (
          <div className="space-y-3">
            {operationsList.map((op) => (
              <div key={op.id} className={`flex items-center justify-between p-3 border rounded-lg ${!op.isActive ? 'bg-gray-50 border-gray-300' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-medium text-lg ${!op.isActive ? 'opacity-40 text-gray-500' : ''}`}>{op.name}</span>
                  {op.code && <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">{op.code}</span>}
                  </div>
                    <div className="flex gap-2">
                  <Button onClick={() => openEditModal(op)} variant="primary" size="small" className="w-auto">Edit</Button>
                  <Button onClick={() => handleToggleStatus(op.id)} variant={op.isActive ? 'warning' : 'success'} size="small" className="w-auto">{op.isActive ? 'Deactivate' : 'Activate'}</Button>
                    </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationManager;
