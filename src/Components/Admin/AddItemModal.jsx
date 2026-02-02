import React, { useState } from "react";
import { Save, Ban, Loader } from "lucide-react";
import api from "../../api/axios";

/**
 * AddItemModal Component
 * Generic modal for adding new gage types, subtypes, manufacturers, etc.
 * 
 * Props:
 *   isOpen: boolean - Whether modal is visible
 *   title: string - Modal title (e.g., "Add New Gage Type")
 *   itemType: string - Type of item to add (used in API endpoint and messages)
 *   endpoint: string - API endpoint for creating item (e.g., "/gage-types/add")
 *   onClose: function - Callback when modal closes
 *   onSuccess: function - Callback with created item on success
 *   fields: array - Array of field configs: { name, label, type, required, placeholder }
 */
const AddItemModal = ({
  isOpen,
  title,
  itemType,
  endpoint,
  onClose,
  onSuccess,
  fields = [{ name: "name", label: "Name", type: "text", required: true }],
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data from fields
  React.useEffect(() => {
    if (isOpen) {
      const initialData = {};
      fields.forEach((field) => {
        initialData[field.name] = "";
      });
      setFormData(initialData);
      setError("");
    }
  }, [isOpen, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.post(endpoint, formData);
      setFormData({});
      
      // Call success callback with new item
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      alert(`✅ ${itemType} created successfully!`);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to create ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Dynamic fields */}
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
            </div>
          ))}

          {/* Footer buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
