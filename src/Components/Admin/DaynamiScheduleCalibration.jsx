import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Wrench, Mail, AlertCircle, FileText, X } from "lucide-react";

const ScheduleCalibration = ({ onClose, gage }) => {
  const [formData, setFormData] = useState({
    gages: gage?.gageName || "",
    date: "",
    technician: "",
    technicianEmail: "",
    calibrationType: "",
    priority: "",
    notes: "",
  });

  useEffect(() => {
    if (gage?.gageName) {
      setFormData((prev) => ({ ...prev, gages: gage.gageName }));
    }
  }, [gage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://qsutrarmsclm.hub.swajyot.co.in:8446/api/gages/send-email",
        formData
      );
      alert("✅ Calibration scheduled and email sent.");
      if (onClose) onClose();
    } catch (err) {
      alert("❌ Failed to schedule calibration");
      console.error("Error scheduling calibration", err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-[#005797] px-6 py-4 flex justify-between items-center rounded-t-xl">
        <h2 className="text-white text-lg font-semibold">Schedule Calibration</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {/* Gage (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Gage *</label>
          <input
            type="text"
            value={formData.gages}
            name="gages"
            disabled
            className="w-full px-4 py-3 border rounded-xl bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Scheduled Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Technician */}
        <div>
          <label className="block text-sm font-medium mb-1">Technician *</label>
          <div className="relative">
            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              required
              placeholder="Technician name"
              className="w-full pl-10 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Technician Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Technician Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="technicianEmail"
              value={formData.technicianEmail}
              onChange={handleChange}
              required
              placeholder="example@domain.com"
              className="w-full pl-10 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Calibration Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Calibration Type *</label>
          <select
            name="calibrationType"
            value={formData.calibrationType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select type</option>
            <option value="Full">Full</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority *</label>
          <div className="relative">
            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full pl-10 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any remarks or instructions"
              className="w-full pl-10 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            type="button"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700"
          >
            💾 Save Calibration
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleCalibration;
