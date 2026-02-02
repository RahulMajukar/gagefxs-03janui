import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Ban, Calendar } from "lucide-react";
import api from "../../api/axios";

export default function InhouseCalibrationMachineForm({ onClose, onSave, defaultValues }) {
  const [gageTypes, setGageTypes] = useState([]);
  const [gageSubTypes, setGageSubTypes] = useState([]);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: defaultValues || {},
  });

  const selectedGageTypeId = watch("gageTypeId");
  const selectedGageSubTypeId = watch("gageSubTypeId");
  const machineName = watch("machineName");
  const instrumentCode = watch("instrumentCode");
  const machineEquipmentNumber = watch("machineEquipmentNumber");

  useEffect(() => {
    const fetchGageTypes = async () => {
      try {
        const res = await api.get("/gage-types/all");
        setGageTypes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch gage types", err);
      }
    };
    fetchGageTypes();
  }, []);

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

  // Reset form when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      reset({
        machineName: defaultValues.machineName || "",
        instrumentCode: defaultValues.instrumentCode || "",
        accuracy: defaultValues.accuracy || "",
        resolution: defaultValues.resolution || "",
        location: defaultValues.location || "",
        status: defaultValues.status || "Active",
        manufacturer: defaultValues.manufacturer || "",
        machineEquipmentNumber: defaultValues.machineEquipmentNumber || "",
        guaranteeExpiryDate: defaultValues.guaranteeExpiryDate || "",
        gageTypeId: defaultValues.gageTypeId?.toString() || "",
        gageSubTypeId: defaultValues.gageSubTypeId?.toString() || "",
      });
    }
  }, [defaultValues, reset]);

  // Check uniqueness of fields
  useEffect(() => {
    const checkUniqueness = async () => {
      if (!machineName || defaultValues?.machineName === machineName) return;
      
      setIsCheckingUniqueness(true);
      try {
        const res = await api.get(`/inhouse-calibration-machines/validate/machine-name?machineName=${machineName}`);
        if (!res.data) {
          setError("machineName", { type: "manual", message: "Machine name already exists" });
        } else {
          clearErrors("machineName");
        }
      } catch (error) {
        console.error("Error checking machine name uniqueness:", error);
      }
      setIsCheckingUniqueness(false);
    };

    const timeoutId = setTimeout(checkUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [machineName, defaultValues, setError, clearErrors]);

  useEffect(() => {
    const checkUniqueness = async () => {
      if (!instrumentCode || defaultValues?.instrumentCode === instrumentCode) return;
      
      setIsCheckingUniqueness(true);
      try {
        const res = await api.get(`/inhouse-calibration-machines/validate/instrument-code?instrumentCode=${instrumentCode}`);
        if (!res.data) {
          setError("instrumentCode", { type: "manual", message: "Instrument code already exists" });
        } else {
          clearErrors("instrumentCode");
        }
      } catch (error) {
        console.error("Error checking instrument code uniqueness:", error);
      }
      setIsCheckingUniqueness(false);
    };

    const timeoutId = setTimeout(checkUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [instrumentCode, defaultValues, setError, clearErrors]);

  useEffect(() => {
    const checkUniqueness = async () => {
      if (!machineEquipmentNumber || defaultValues?.machineEquipmentNumber === machineEquipmentNumber) return;
      
      setIsCheckingUniqueness(true);
      try {
        const res = await api.get(`/inhouse-calibration-machines/validate/equipment-number?machineEquipmentNumber=${machineEquipmentNumber}`);
        if (!res.data) {
          setError("machineEquipmentNumber", { type: "manual", message: "Machine equipment number already exists" });
        } else {
          clearErrors("machineEquipmentNumber");
        }
      } catch (error) {
        console.error("Error checking equipment number uniqueness:", error);
      }
      setIsCheckingUniqueness(false);
    };

    const timeoutId = setTimeout(checkUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [machineEquipmentNumber, defaultValues, setError, clearErrors]);

  const handleCalendarClick = (fieldName) => {
    const dateInput = document.querySelector(`input[name="${fieldName}"]`);
    if (dateInput) {
      dateInput.showPicker();
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        machineName: data.machineName,
        instrumentName: data.machineName, // Use machine name for instrument name
        instrumentCode: data.instrumentCode,
        accuracy: data.accuracy,
        resolution: data.resolution,
        location: data.location,
        status: data.status,
        manufacturer: data.manufacturer,
        machineEquipmentNumber: data.machineEquipmentNumber,
        guaranteeExpiryDate: data.guaranteeExpiryDate,
        gageTypeId: parseInt(data.gageTypeId),
        gageSubTypeId: parseInt(data.gageSubTypeId),
      };
      
      if (defaultValues?.id) {
        await api.put(`/inhouse-calibration-machines/${defaultValues.id}`, payload);
        alert("✅ Updated successfully");
      } else {
        await api.post("/inhouse-calibration-machines/add", payload);
        alert("✅ Added successfully");
      }
      reset();
      onClose();
      if (onSave) onSave(payload);
    } catch (error) {
      console.error(error);
      if (error.response?.data) {
        alert(`❌ Failed: ${error.response.data}`);
      } else {
        alert("❌ Failed to save");
      }
    }
  };

  const statusOptions = ["Active", "Inactive", "Under Maintenance", "Calibration Due", "Out of Service"];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 w-[900px] max-w-full max-h-[80vh] overflow-y-auto"
    >
      <div className="bg-white border rounded-xl p-6 shadow-md">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Side - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
            
            {/* Machine Name */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Machine Name *
              </label>
              <input
                type="text"
                {...register("machineName", { required: "Machine name is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter machine name"
              />
              {errors.machineName && (
                <p className="text-red-500 text-xs mt-1">{errors.machineName.message}</p>
              )}
            </div>

            {/* Machine Equipment Number */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Machine/Equipment Number *
              </label>
              <input
                type="text"
                {...register("machineEquipmentNumber", { required: "Machine equipment number is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter equipment number"
              />
              {errors.machineEquipmentNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.machineEquipmentNumber.message}</p>
              )}
            </div>

            {/* Gage Type */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Gage Type *
              </label>
              <select
                {...register("gageTypeId", { required: "Gage Type is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Gage Type</option>
                {gageTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>
                    {gt.name}
                  </option>
                ))}
              </select>
              {errors.gageTypeId && (
                <p className="text-red-500 text-xs mt-1">{errors.gageTypeId.message}</p>
              )}
            </div>

            {/* Gage Sub-Type */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Gage Sub-Type *
              </label>
              <select
                {...register("gageSubTypeId", { required: "Gage Sub-Type is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Gage Sub-Type</option>
                {gageSubTypes.map((gst) => (
                  <option key={gst.id} value={gst.id}>
                    {gst.name}
                  </option>
                ))}
              </select>
              {errors.gageSubTypeId && (
                <p className="text-red-500 text-xs mt-1">{errors.gageSubTypeId.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Status *
              </label>
              <select
                {...register("status", { required: "Status is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Right Side - Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>

            {/* Instrument Code */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Instrument Code *
              </label>
              <input
                type="text"
                {...register("instrumentCode", { required: "Instrument code is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter instrument code"
              />
              {errors.instrumentCode && (
                <p className="text-red-500 text-xs mt-1">{errors.instrumentCode.message}</p>
              )}
            </div>

            {/* Accuracy */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Accuracy *
              </label>
              <input
                type="text"
                {...register("accuracy", { required: "Accuracy is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., ±0.01 mm"
              />
              {errors.accuracy && (
                <p className="text-red-500 text-xs mt-1">{errors.accuracy.message}</p>
              )}
            </div>

            {/* Resolution */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Resolution *
              </label>
              <input
                type="text"
                {...register("resolution", { required: "Resolution is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., 0.001 mm"
              />
              {errors.resolution && (
                <p className="text-red-500 text-xs mt-1">{errors.resolution.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Location *
              </label>
              <input
                type="text"
                {...register("location", { required: "Location is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter location"
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
              )}
            </div>

            {/* Manufacturer */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                {...register("manufacturer", { required: "Manufacturer is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter manufacturer name"
              />
              {errors.manufacturer && (
                <p className="text-red-500 text-xs mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            {/* Guarantee Expiry Date */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-1">
                Guarantee Expiry Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register("guaranteeExpiryDate", { required: "Guarantee expiry date is required" })}
                  className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCalendarClick("guaranteeExpiryDate")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
              {errors.guaranteeExpiryDate && (
                <p className="text-red-500 text-xs mt-1">{errors.guaranteeExpiryDate.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
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
          disabled={isCheckingUniqueness}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" /> 
          {isCheckingUniqueness ? "Checking..." : (defaultValues ? "Update" : "Save")}
        </button>
      </div>
    </form>
  );
}