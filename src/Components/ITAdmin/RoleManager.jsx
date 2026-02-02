import React, { useState } from "react";
import InputField from "../../form/InputField";
import Button from "../../ui/Button";
import { getRoles, createRole, updateRole, toggleRoleActive } from "../../api/api";

const RoleManager = ({ roles = [], functions = [], operations = [], onRolesChange }) => {
  const [rolesList, setRolesList] = useState(
    roles.map(role => ({ ...role, isActive: role.isActive ?? true }))
  );
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    },
    functionIds: [],
    operationIds: []
  });

  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      description: "",
      permissions: { canView: false, canCreate: false, canEdit: false, canDelete: false },
      functionIds: [],
      operationIds: []
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingRole(null);
    resetRoleForm();
    setShowModal(true);
  };

  React.useEffect(() => {
    (async () => {
      try {
        const list = await getRoles();
        setRolesList(list);
      } catch (e) {}
    })();
  }, []);

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || "",
      description: role.description || "",
      permissions: role.permissions || { canView: false, canCreate: false, canEdit: false, canDelete: false },
      functionIds: Array.isArray(role.functionIds) ? role.functionIds : (role.functions?.map(f => f.id) || []),
      operationIds: Array.isArray(role.operationIds) ? role.operationIds : (role.operations?.map(o => o.id) || [])
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!roleForm.name.trim()) errors.name = "Role name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleInArray = (field, id) => {
    setRoleForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter(x => x !== id) : [...prev[field], id]
    }));
  };

  const saveRole = async () => {
    if (!validateForm()) return;

    const nameLower = roleForm.name.trim().toLowerCase();
    const exists = rolesList.some(r => 
      (editingRole ? r.id !== editingRole.id : true) && r.name.toLowerCase() === nameLower
    );
    if (exists) {
      setFormErrors(prev => ({ ...prev, name: "Role with this name already exists" }));
      return;
    }
    
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: roleForm.name.trim(), description: roleForm.description, isActive: editingRole.isActive });
      } else {
        await createRole({ name: roleForm.name.trim(), description: roleForm.description || "", isActive: true });
      }
      const list = await getRoles();
      setRolesList(list);
      onRolesChange?.(list);
    } catch (e) {}

    setShowModal(false);
    setEditingRole(null);
    resetRoleForm();
  };

  const handleToggleStatus = async (roleId) => {
    try {
      const current = rolesList.find(r => r.id === roleId);
      await toggleRoleActive(roleId, !(current?.isActive));
      const list = await getRoles();
      setRolesList(list);
      onRolesChange?.(list);
    } catch (e) {}
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-red-700">Role Management</h2>
        <Button onClick={openAddModal} variant="primary" size="medium" className="w-auto">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Role
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#005797] text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{editingRole ? "Edit Role" : "Add Role"}</h2>
                  <p className="text-rose-100 mt-1">Role details and permissions</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingRole(null); }} className="text-white hover:text-gray-200">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
          <InputField
            type="text"
            placeholder="Enter role name"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      error={formErrors.name}
          />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <InputField
            type="text"
                      placeholder="Enter description"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'canView', label: 'View' },
                    { key: 'canCreate', label: 'Create' },
                    { key: 'canEdit', label: 'Edit' },
                    { key: 'canDelete', label: 'Delete' }
                  ].map(p => (
                    <label key={p.key} className="inline-flex items-center gap-2 p-2 bg-white rounded border">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions[p.key]}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, permissions: { ...prev.permissions, [p.key]: e.target.checked } }))}
                      />
                      <span className="text-sm text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Scope</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Functions</label>
                    <div className="bg-white border border-gray-300 rounded-lg">
                      <div className="max-h-36 overflow-y-auto p-2">
                        {functions.map(fn => (
                          <label key={fn.id} className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleForm.functionIds.includes(fn.id)}
                              onChange={() => toggleInArray('functionIds', fn.id)}
                              className="rounded text-red-600"
                            />
                            <span className="text-sm text-gray-700">{fn.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operations</label>
                    <div className="bg-white border border-gray-300 rounded-lg">
                      <div className="max-h-36 overflow-y-auto p-2">
                        {operations.map(op => (
                          <label key={op.id} className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleForm.operationIds.includes(op.id)}
                              onChange={() => toggleInArray('operationIds', op.id)}
                              className="rounded text-red-600"
                            />
                            <span className="text-sm text-gray-700">{op.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
        </div>
      </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button onClick={() => { setShowModal(false); setEditingRole(null); }} variant="secondary" size="medium" className="w-auto">Cancel</Button>
              <Button onClick={saveRole} variant="primary" size="medium" className="w-auto">Save</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Current Roles</h3>
        {rolesList.length === 0 ? (
          <p className="text-gray-500 italic">No roles available</p>
        ) : (
          <div className="space-y-3">
            {rolesList.map((role) => (
              <div key={role.id} className={`flex items-center justify-between p-3 border rounded-lg ${!role.isActive ? 'bg-gray-50 border-gray-300' : ''}`}>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg text-gray-800 ${!role.isActive ? 'opacity-40 text-gray-500' : ''}`}>{role.name}</h4>
                      <p className={`text-gray-600 mt-1 ${!role.isActive ? 'opacity-40' : ''}`}>{role.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                  <Button onClick={() => openEditModal(role)} variant="primary" size="small" className="w-auto">Edit</Button>
                  <Button onClick={() => handleToggleStatus(role.id)} variant={role.isActive ? 'warning' : 'success'} size="small" className="w-auto">{role.isActive ? 'Deactivate' : 'Activate'}</Button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManager;
