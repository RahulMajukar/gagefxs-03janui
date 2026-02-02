import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { LayoutGrid, Table2, X } from "lucide-react";
import { Tooltip } from "@mui/material";

import ServiceProviderCardView from "./ServiceProviderCardView";
import ServiceProviderTableView from "./ServiceProviderTableView";
import AddServiceProvider from "./ServiceProviderDetails";
import EditServiceProviderForm from "./EditServiceProviderForm";

// Add props for parent control
const ServiceProviderInventory = ({ isOpen, onClose }) => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("card");
  const [activeModal, setActiveModal] = useState(null); // Start as null
  const [editingProvider, setEditingProvider] = useState(null);

  // Sync with parent isOpen prop
  useEffect(() => {
    if (isOpen) {
      setActiveModal("inventory");
    } else {
      setActiveModal(null);
      setEditingProvider(null);
    }
  }, [isOpen]);

  // Fetch service providers
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/service-providers");
      const data = Array.isArray(res.data) ? res.data : [];
      const normalized = data.map((p) => ({ ...p, id: p.id || p._id }));
      setServiceProviders(normalized);
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError("Failed to load service providers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries once
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd"
        );
        const data = await res.json();
        const formatted = data
          .map((c) => {
            const dial =
              c.idd?.root && c.idd?.suffixes?.length
                ? c.idd.root + c.idd.suffixes[0]
                : "";
            return {
              name: c.name?.common || "",
              dial_code: dial,
              flag: c.cca2
                ? `https://flagcdn.com/w40/${c.cca2.toLowerCase()}.png`
                : "",
              code: c.cca2 || "",
            };
          })
          .filter((c) => c.name && c.dial_code && c.code)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountryData(formatted);
      } catch (err) {
        console.error("Failed to load countries:", err);
      }
    };
    fetchCountries();
  }, []);

  // Initial fetch of providers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  // Open edit modal
  const openEditModal = async (id) => {
    if (!id) {
      alert("Invalid provider ID");
      return;
    }
    try {
      const res = await axios.get(`/service-providers/${id}`);
      const provider = { ...res.data, id: res.data.id || res.data._id };
      setEditingProvider(provider);
      setActiveModal("edit");
    } catch (err) {
      console.error("Failed to load provider details:", err);
      alert("Unable to load service provider details");
    }
  };

  // Handle update
  const handleUpdatedProvider = async (updatedProvider) => {
    try {
      const response = await axios.put(
        `/service-providers/${updatedProvider.id || updatedProvider._id}`,
        updatedProvider
      );
      const updated = {
        ...response.data,
        id: response.data.id || response.data._id,
      };
      setServiceProviders((prev) =>
        prev.map((sp) => (sp.id === updated.id ? updated : sp))
      );
      alert("Service provider updated successfully ✅");
      closeModal();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update service provider");
    }
  };

  // Close modal handler
  const closeModal = () => {
    if (activeModal === "edit" || activeModal === "add") {
      setActiveModal("inventory"); // go back to inventory
    } else {
      // Close everything and notify parent
      setActiveModal(null);
      setEditingProvider(null);
      onClose?.(); // Call parent's onClose
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Inventory Modal */}
      {activeModal === "inventory" && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-7xl max-h-[90vh] overflow-auto p-6 rounded-lg shadow-xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-red-600 hover:text-red-900 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="bg-[#005797] border border-[#004377] rounded-md p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 text-white">
                <Table2 className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-semibold">
                  View Service Provider Details
                </h2>
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
                  title="Add New Service Provider"
                  onClick={() => setActiveModal("add")}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors font-medium"
                >
                  + Add Service Provider
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <p>Loading service providers...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {viewMode === "table" ? (
                  <ServiceProviderTableView
                    data={serviceProviders}
                    countryData={countryData}
                    onEdit={(provider) =>
                      openEditModal(provider.id || provider._id)
                    }
                  />
                ) : (
                  <ServiceProviderCardView
                    data={serviceProviders}
                    countryData={countryData}
                    onEdit={(provider) =>
                      openEditModal(provider.id || provider._id)
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {activeModal === "add" && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
              aria-label="Close Add"
            >
              <X className="h-6 w-6" />
            </button>

            <AddServiceProvider
              countryData={countryData}
              onSuccess={() => {
                fetchProviders();
                closeModal();
              }}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {activeModal === "edit" && editingProvider && countryData.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
              aria-label="Close Edit"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-6">
              <EditServiceProviderForm
                defaultValues={{
                  id: editingProvider.id,
                  serviceProviderName: editingProvider.serviceProviderName,
                  serviceContact: editingProvider.serviceContact,
                  serviceCountry: editingProvider.serviceCountry,
                  servicePhone: editingProvider.servicePhone,
                  serviceEmail: editingProvider.serviceEmail,
                  serviceWebsite: editingProvider.serviceWebsite,
                  serviceAddress: editingProvider.serviceAddress,
                  serviceAccreditation: editingProvider.serviceAccreditation,
                }}
                countryData={countryData}
                onClose={closeModal}
                onUpdate={handleUpdatedProvider}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceProviderInventory;