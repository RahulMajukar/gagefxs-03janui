// src/components/yourfolder/GageInventory.jsx
import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import {
  Boxes, LayoutGrid, Table2, Scan, CheckCircle, X, AlertTriangle
} from "lucide-react";
import EditGage from "./EditGage";
import { Tooltip } from "@mui/material";
import GageInventoryMRT from "./GageInventoryMRT";
import GageCardView from "./GageCardView";
import GageForm from "./GageForm";
import GageScanner from "../Layout/GageScanner";

const GageInventory = ({ isModal = true, onClose }) => {
  const [viewMode, setViewMode] = useState("card");
  const [gagesData, setGagesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedGage, setSelectedGage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGage, setEditingGage] = useState(null);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // ✅ Custom Popup State for Retire Only
  const [retirePopup, setRetirePopup] = useState({
    isOpen: false,
    type: null, // 'confirm', 'success', 'error'
    message: "",
    onConfirm: null,
    gageId: null,
    gageName: null,
  });

  const normalizeGage = (g) => {
    if (!g) return g;
    return { ...g, id: g.id ?? g._id ?? g.gageId ?? null };
  };

  const fetchGages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/gages");
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.result ?? [];
      setGagesData(list.map(normalizeGage));
      setError(null);
    } catch (err) {
      setError("Failed to load gages.");
      setGagesData([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (gageId) => {
    if (!gageId) return;
    try {
      const response = await axios.get(`/gages/${gageId}`);
      const gage = response.data?.data ?? response.data;
      setEditingGage(normalizeGage(gage));
    } catch (err) {
      alert("Error loading gage details.");
    }
  };

  const closeEditModal = () => {
    setEditingGage(null);
  };

  const handleUpdatedGage = (updatedGage) => {
    if (!updatedGage) return;
    const normalized = normalizeGage(updatedGage);
    setGagesData((prev) => prev.map((g) => (g.id === normalized.id ? normalized : g)));
    closeEditModal();
  };

  // ✅ Updated handleRetire with Custom Popup
  const handleRetire = async (id, name) => {
    if (!id) return;

    // Show confirmation popup
    setRetirePopup({
      isOpen: true,
      type: "confirm",
      message: `Are you sure you want to retire "${name}"?`,
      gageId: id,
      gageName: name,
      onConfirm: null, // will be set in popup render
    });
  };

  const executeRetire = async () => {
    const { gageId, gageName } = retirePopup;
    setRetirePopup({ isOpen: false });

    try {
      await axios.put(`/gages/${gageId}/retire`);
      setGagesData((prev) => prev.map((g) => (g.id === gageId ? { ...g, status: "RETIRED" } : g)));
      // Show success
      setRetirePopup({
        isOpen: true,
        type: "success",
        message: `"${gageName}" has been retired.`,
        onConfirm: () => setRetirePopup({ isOpen: false }),
      });
    } catch (error) {
      // Show error
      setRetirePopup({
        isOpen: true,
        type: "error",
        message: "Failed to retire gage.",
        onConfirm: () => setRetirePopup({ isOpen: false }),
      });
    }
  };

  const handleScanResult = (result) => {
    setScanResult(result);
    setShowScanner(false);
  };

  useEffect(() => {
    fetchGages();
  }, []);

  // If not in modal mode, render inline (for backward compatibility)
  if (!isModal) {
    return (
      <div className="w-full">
        {/* Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scan Barcode/QR</h3>
                <button onClick={() => setShowScanner(false)} className="text-gray-600 hover:text-gray-900">
                  <X size={24} />
                </button>
              </div>
              <GageScanner onClose={() => setShowScanner(false)} onScanResult={handleScanResult} />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="w-full">
          {/* Header for inline mode */}
          <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Boxes className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Gage Inventory</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-1 px-3 py-1 bg-green-300 text-sm text-black rounded hover:bg-green-100"
              >
                <Scan size={20} />
              </button>
              <button
                className={`p-2 rounded-md border ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-5 w-5" />
              </button>
              <button
                className={`p-2 rounded-md border ${
                  viewMode === "card"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + New Gage
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading && <p>Loading gages...</p>}
            {error && <p className="text-red-600">{error}</p>}
            
            {!loading && !error && (
              <>
                {viewMode === "table" ? (
                  <GageInventoryMRT
                    gagesData={gagesData}
                    setGagesData={setGagesData}
                    loading={loading}
                  />
                ) : (
                  <GageCardView
                    gages={gagesData}
                    onRetire={handleRetire}
                    onSchedule={(gage) => {
                      setSelectedGage(gage);
                      setShowSchedule(true);
                    }}
                    selectedGage={selectedGage}
                    showSchedule={showSchedule}
                    setShowSchedule={setShowSchedule}
                    setSelectedGage={setSelectedGage}
                    onUpdated={handleUpdatedGage}
                    onEdit={openEditModal}
                    externalScanResult={scanResult}
                    onClearScan={() => setScanResult(null)}
                  />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center bg-blue-500 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-semibold">Add Gage</h3>
                <button
                  className="text-white hover:text-gray-200 font-bold text-xl"
                  onClick={() => setShowAddForm(false)}
                >
                  &times;
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <GageForm
                  onGageAdded={fetchGages}
                  onClose={() => setShowAddForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal mode (when opened from main page)
  return (
    <>
      {/* ✅ Custom Retire Popup */}
      {retirePopup.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {retirePopup.type === "confirm" && (
                  <AlertTriangle className="text-yellow-500" size={24} />
                )}
                {retirePopup.type === "success" && (
                  <CheckCircle className="text-green-500" size={24} />
                )}
                {retirePopup.type === "error" && (
                  <AlertTriangle className="text-red-500" size={24} />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {retirePopup.type === "confirm"
                    ? "Confirm Retirement"
                    : retirePopup.type === "success"
                    ? "Success"
                    : "Error"}
                </h3>
                <p className="mt-2 text-gray-700">{retirePopup.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              {retirePopup.type === "confirm" ? (
                <>
                  <button
                    onClick={() => setRetirePopup({ isOpen: false })}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeRetire}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={retirePopup.onConfirm}
                  className={`px-4 py-2 text-white rounded ${
                    retirePopup.type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white w-full max-w-7xl max-h-[90vh] overflow-auto rounded-lg shadow-xl relative">
          {/* Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center bg-[#005797] text-white p-4">
            <div className="flex items-center gap-3 ml-3">
              <Boxes className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Gage Inventory</h2>
            </div>

            <div className="flex items-center gap-2 mr-3">
              {/* Scan Barcode Button in Header */}


              <Tooltip title="Switch to Table View">
                <button
                  className={`p-2 rounded-md border ${
                    viewMode === "table"
                      ? "bg-white text-[#005797] border-white"
                      : "bg-[#004377] text-white hover:bg-[#00325c]"
                  } transition duration-200`}
                  onClick={() => setViewMode("table")}
                >
                  <Table2 className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip title="Switch to Card View">
                <button
                  className={`p-2 rounded-md border ${
                    viewMode === "card"
                      ? "bg-white text-[#005797] border-white"
                      : "bg-[#004377] text-white hover:bg-[#00325c]"
                  } transition duration-200`}
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
              </Tooltip>

              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1 bg-green-300 text-gray-600 hover:bg-green-100 rounded transition duration-200"
              >
                + New Gage
              </button>

              <button
                onClick={onClose}
                className="ml-2 font-bold text-xl hover:text-gray-200"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Scan Success Banner */}
          {scanResult && (
            <div className="bg-green-50 border-b border-green-200 p-3 flex items-center justify-between mx-4 mt-2 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-green-800 font-medium">
                  Scanned: {scanResult.serialNumber}
                </span>
              </div>
              <button onClick={() => setScanResult(null)} className="text-green-600">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="p-4">
            {loading && <p>Loading gages...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
              <>
                {viewMode === "table" ? (
                  <GageInventoryMRT
                    gagesData={gagesData}
                    setGagesData={setGagesData}
                    loading={loading}
                  />
                ) : (
                  <GageCardView
                    gages={gagesData}
                    onRetire={handleRetire}
                    onSchedule={(gage) => {
                      setSelectedGage(gage);
                      setShowSchedule(true);
                    }}
                    selectedGage={selectedGage}
                    showSchedule={showSchedule}
                    setShowSchedule={setShowSchedule}
                    setSelectedGage={setSelectedGage}
                    onUpdated={handleUpdatedGage}
                    onEdit={openEditModal}
                    externalScanResult={scanResult}
                    onClearScan={() => setScanResult(null)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center bg-[#005797] text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Add Gage</h3>
              <button
                className="text-white hover:text-gray-200 font-bold text-xl"
                onClick={() => setShowAddForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <GageForm
                onGageAdded={fetchGages}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="relative bg-white p-6 max-w-5xl w-full rounded shadow-xl mt-10 mb-10 max-h-screen overflow-y-auto">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>
            <EditGage
              gage={editingGage}
              onCancel={closeEditModal}
              onUpdated={handleUpdatedGage}
            />
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <GageScanner 
          onClose={() => setShowScanner(false)}
          onScanResult={handleScanResult}
        />
      )}
    </>
  );
};

export default GageInventory;