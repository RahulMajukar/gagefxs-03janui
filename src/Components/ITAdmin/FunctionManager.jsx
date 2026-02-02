import React, { useState } from "react";
import InputField from "../../form/InputField";
import Button from "../../ui/Button";
import { getFunctions, createFunction, updateFunction, toggleFunctionActive } from "../../api/api";

const FunctionManager = ({ 
  functions = [], 
  onFunctionsChange 
}) => {
  const [functionsList, setFunctionsList] = useState(
    functions.map(func => ({ ...func, isActive: func.isActive ?? true }))
  );
  const [showModal, setShowModal] = useState(false);
  const [editingFunc, setEditingFunc] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [funcForm, setFuncForm] = useState({
    name: "",
    code: "",
    description: ""
  });

  const resetFuncForm = () => {
    setFuncForm({
      name: "",
      code: "",
      description: ""
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingFunc(null);
    resetFuncForm();
    setShowModal(true);
  };

  React.useEffect(() => {
    (async () => {
      try {
        const list = await getFunctions();
        setFunctionsList(list);
      } catch (e) {}
    })();
  }, []);

  const openEditModal = (func) => {
    setEditingFunc(func);
    setFuncForm({
      name: func.name || "",
      code: func.code || "",
      description: func.description || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!funcForm.name.trim()) errors.name = "Function name is required";
    if (funcForm.code && !/^[A-Za-z0-9_-]{2,15}$/.test(funcForm.code)) errors.code = "Use 2-15 letters, numbers, - or _";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveFunction = async () => {
    if (!validateForm()) return;

    const nameLower = funcForm.name.trim().toLowerCase();
    const exists = functionsList.some(f =>
      (editingFunc ? f.id !== editingFunc.id : true) && f.name.toLowerCase() === nameLower
    );
    if (exists) {
      setFormErrors(prev => ({ ...prev, name: "Function with this name already exists" }));
      return;
    }

    try {
      if (editingFunc) {
        await updateFunction(editingFunc.id, { ...funcForm, name: funcForm.name.trim() });
      } else {
        await createFunction({ ...funcForm, name: funcForm.name.trim() });
      }
      const list = await getFunctions();
      setFunctionsList(list);
      onFunctionsChange?.(list);
    } catch (e) {}

    setShowModal(false);
    setEditingFunc(null);
    resetFuncForm();
  };

  const handleToggleStatus = async (funcId) => {
    try {
      const current = functionsList.find(f => f.id === funcId);
      await toggleFunctionActive(funcId, !(current?.isActive));
      const list = await getFunctions();
      setFunctionsList(list);
      onFunctionsChange?.(list);
    } catch (e) {}
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-700">Function Management</h2>
        <Button onClick={openAddModal} variant="primary" size="medium" className="w-auto">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Function
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#005797] text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{editingFunc ? "Edit Function" : "Add Function"}</h2>
                  <p className="text-green-100 mt-1">Function details</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingFunc(null); }} className="text-white hover:text-gray-200">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Function Name *</label>
                    <InputField
                      type="text"
                      placeholder="Enter function name"
                      value={funcForm.name}
                      onChange={(e) => setFuncForm(prev => ({ ...prev, name: e.target.value }))}
                      error={formErrors.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                    <InputField
                      type="text"
                      placeholder="e.g. FNC-01"
                      value={funcForm.code}
                      onChange={(e) => setFuncForm(prev => ({ ...prev, code: e.target.value }))}
                      error={formErrors.code}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <InputField
                    type="text"
                    placeholder="Enter description"
                    value={funcForm.description}
                    onChange={(e) => setFuncForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button onClick={() => { setShowModal(false); setEditingFunc(null); }} variant="secondary" size="medium" className="w-auto">Cancel</Button>
              <Button onClick={saveFunction} variant="primary" size="medium" className="w-auto">Save</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Current Functions</h3>
        {functionsList.length === 0 ? (
          <p className="text-gray-500 italic">No functions available</p>
        ) : (
          <div className="space-y-3">
            {functionsList.map((func) => (
              <div key={func.id} className={`flex items-center justify-between p-3 border rounded-lg ${!func.isActive ? 'bg-gray-50 border-gray-300' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-medium text-lg ${!func.isActive ? 'opacity-40 text-gray-500' : ''}`}>{func.name}</span>
                  {func.code && <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{func.code}</span>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openEditModal(func)} variant="primary" size="small" className="w-auto">Edit</Button>
                  <Button onClick={() => handleToggleStatus(func.id)} variant={func.isActive ? 'warning' : 'success'} size="small" className="w-auto">{func.isActive ? 'Deactivate' : 'Activate'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionManager;
