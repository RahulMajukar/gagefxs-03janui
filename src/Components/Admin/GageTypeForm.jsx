import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Ban } from "lucide-react";
import api from "../../api/axios";

export default function GageTypeForm({ onClose, onSave, defaultValues }) {
  const [gageSubTypes, setGageSubTypes] = useState([]);
  const [isAddingNewSubType, setIsAddingNewSubType] = useState(false);
  const [newSubTypeName, setNewSubTypeName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: defaultValues || {},
  });

  const selectedSubTypeId = watch("gageSubTypeId");

  useEffect(() => {
    const fetchGageSubTypes = async () => {
      try {
        const res = await api.get("/gage-sub-types/all");
        setGageSubTypes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch gage sub types", err);
      }
    };
    fetchGageSubTypes();
  }, []);

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (selectedSubTypeId === "__new__") {
      setIsAddingNewSubType(true);
      setNewSubTypeName("");
    } else {
      setIsAddingNewSubType(false);
    }
  }, [selectedSubTypeId]);

  const onSubmit = async (data) => {
    try {
      let finalSubTypeId = null;

      if (data.gageSubTypeId === "__new__") {
        if (!newSubTypeName.trim()) {
          alert("❌ Please enter a valid gage sub-type name.");
          return;
        }
        const createRes = await api.post("/gage-sub-types/add", {
          name: newSubTypeName.trim(),
        });
        finalSubTypeId = createRes.data.id;
        setGageSubTypes((prev) => [...prev, createRes.data]);
      } else {
        finalSubTypeId = parseInt(data.gageSubTypeId);
      }

      const payload = {
        name: data.name,
        gageSubTypeId: finalSubTypeId,
        description: data.description || null,
      };

      if (defaultValues?.id) {
        await api.put(`/gage-types/${defaultValues.id}`, payload);
        alert("✅ Updated successfully");
      } else {
        await api.post("/gage-types/add", payload);
        alert("✅ Added successfully");
      }

      reset();
      onClose();
      if (onSave) onSave(payload);
    } catch (error) {
      console.error(error);
      alert("❌ Failed to save gage type");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-[500px] max-w-full">
      <div className="bg-white border rounded-xl p-6 shadow-md">
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1">Gage Type Name *</label>
          <input
            type="text"
            {...register("name", { required: "Gage Type name is required" })}
            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter gage type name"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1">Gage Sub-Type *</label>
          <select
            {...register("gageSubTypeId", {
              required: "Gage Sub-Type is required",
              validate: (value) =>
                value === "__new__"
                  ? newSubTypeName.trim() !== "" || "Please enter a sub-type name"
                  : true,
            })}
            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select Gage Sub-Type</option>
            {gageSubTypes.map((gst) => (
              <option key={gst.id} value={gst.id}>
                {gst.name}
              </option>
            ))}
            <option value="__new__">+ Add New Sub-Type</option>
          </select>
          {errors.gageSubTypeId && (
            <p className="text-red-500 text-xs mt-1">{errors.gageSubTypeId.message}</p>
          )}

          {isAddingNewSubType && (
            <div className="mt-2">
              <input
                type="text"
                value={newSubTypeName}
                onChange={(e) => setNewSubTypeName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Enter new gage sub-type name"
                autoFocus
              />
              {newSubTypeName.trim() === "" && (
                <p className="text-red-500 text-xs mt-1">Sub-type name is required</p>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Optional description"
            rows="3"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <Ban className="w-5 h-5" /> Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl shadow hover:bg-purple-700"
        >
          <Save className="w-5 h-5" /> {defaultValues ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}