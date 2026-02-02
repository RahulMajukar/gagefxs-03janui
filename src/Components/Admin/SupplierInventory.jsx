import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Boxes, LayoutGrid, Table2 } from "lucide-react";
import { Tooltip } from "@mui/material";

import SupplierCardView from "./SupplierCardView";
import SupplierForm from "./Gaugesupplier";
import EditSupplierForm from "./EditSupplierForm";
import SupplierTableView from "./SupplierTableView";

const SupplierInventory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("table");
  const [activeModal, setActiveModal] = useState(null); // "inventory", "add", "edit"
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Fetch suppliers list
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/suppliers");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries for a supplier
  const fetchCountries = async (id) => {
    try {
      const res = await axios.get(`/suppliers/country/${id}`);
      setCountryData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load countries:", err);
      setCountryData([]);
    }
  };

  // Load supplier details for editing
  const openEditModal = async (id) => {
    try {
      const res = await axios.get(`/suppliers/${id}`);
      setEditingSupplier(res.data);
      await fetchCountries(id);
      setActiveModal("edit");
    } catch (err) {
      console.error("Failed to load supplier details:", err);
      alert("Unable to load supplier details");
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingSupplier(null);
    setCountryData([]);
  };

  const handleUpdatedSupplier = (updatedSupplier) => {
  setSuppliers((prev) =>
    prev.map((s) =>
      (s.id || s._id) === (updatedSupplier.id || updatedSupplier._id)
        ? { ...s, ...updatedSupplier }
        : s
    )
  );

  alert("Supplier updated successfully ✅"); // 🔹 Show success message
  closeModal();
};


  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <>
      {/* Launch Tile */}
      <div
        onClick={() => setActiveModal("inventory")}
        className="cursor-pointer bg-gradient-to-tr from-white via-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 border border-gray-200 border-l-8 border-l-pink-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out p-6 flex flex-col items-center text-center max-w-xs mx-auto"
      >
        <div className="bg-purple-100 p-3 rounded-full mb-4 shadow-sm">
          <Boxes className="h-8 w-8 text-pink-600" />
        </div>
        <span className="font-semibold text-lg text-gray-800">
          Supplier Inventory
        </span>
        <p className="text-sm text-gray-500 mt-1">
          View and manage supplier inventory
        </p>
      </div>

      {/* Inventory Modal */}
      {activeModal === "inventory" && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-7xl max-h-[90vh] overflow-auto p-6 rounded-lg shadow-xl relative">
            <button
              onClick={closeModal}
              className="absolute top-1 right-1 text-gray-600 hover:text-gray-900 font-bold text-2xl"
            >
              &times;
            </button>

            {/* Header */}
            <div className="bg-[#005797] border border-[#004377] rounded-md p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 text-white">
                <Boxes className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-semibold">View Supplier Details</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Tooltip title="Switch to Table View">
                  <button
                    className={`p-2 rounded-md border ${
                      viewMode === "table"
                        ? "bg-white text-[#005797] border-white"
                        : "bg-[#004377] text-white hover:bg-[#00325c]"
                    }`}
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
                    }`}
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                </Tooltip>

                <button
                  onClick={() => setActiveModal("add")}
                  className="px-4 py-1 mt-2 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  + Add Supplier
                </button>
              </div>
            </div>

            {/* Main Content */}
            {loading && <p>Loading suppliers...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && (
              <>
                {viewMode === "table" ? (
                  <SupplierTableView
                    data={suppliers}
                    setSuppliers={setSuppliers}
                    onEdit={(supplier) =>
                      openEditModal(supplier.id || supplier._id)
                    }
                  />
                ) : (
                  <SupplierCardView
                    data={suppliers}
                    onEdit={(supplier) =>
                      openEditModal(supplier.id || supplier._id)
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {activeModal === "add" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✖
            </button>
            <SupplierForm
              countryData={countryData}
              onSupplierAdded={() => {
                fetchSuppliers();
                closeModal();
              }}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {activeModal === "edit" && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="relative bg-white p-6 max-w-5xl w-full rounded shadow-xl mt-10 mb-10 max-h-screen overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>

            <EditSupplierForm
              defaultValues={editingSupplier}
              countryData={countryData}
              onClose={closeModal}
              onSubmit={async (updatedData) => {
                try {
                  const res = await axios.put(
                    `/suppliers/${editingSupplier.id || editingSupplier._id}`,
                    updatedData
                  );
                  handleUpdatedSupplier(res.data);
                } catch (err) {
                  console.error("Failed to update supplier", err);
                  alert("Failed to update supplier");
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierInventory;
