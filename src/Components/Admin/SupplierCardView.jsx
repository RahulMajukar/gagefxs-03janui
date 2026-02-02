import React, { useState, useEffect } from "react";
import {
  Search, Eye, EyeOff, Pencil, ChevronLeft, ChevronRight,
  MapPin, User, Phone, Mail, Globe, FileText, Building, Info
} from "lucide-react";
import EditSupplierForm from "./EditSupplierForm";
import axios from "../../api/axios"; // ✅ Use your existing axios instance

const ITEMS_PER_PAGE = 6;

const SupplierCardView = ({ countryData = [] }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllDetails, setShowAllDetails] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ Fetch suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = suppliers.filter((supplier) =>
    (supplier.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSchedule = (supplier) => {
    alert(`📅 Scheduling meeting with ${supplier.supplierName}`);
  };

  const handleRetire = async (supplier) => {
    const confirmRetire = window.confirm(`Retire ${supplier.supplierName}?`);
    if (!confirmRetire) return;

    try {
      await axios.put(`/suppliers/retire/${supplier.id}`);
      await fetchSuppliers(); // ✅ Refresh data
      alert(`${supplier.supplierName} has been retired.`);
    } catch (error) {
      console.error("Error retiring supplier:", error);
      alert("Failed to retire supplier.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search + Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <Search className="text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by name or contact..."
            className="border border-gray-300 rounded px-3 py-1 w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button
          onClick={() => setShowAllDetails(prev => !prev)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200"
        >
          {showAllDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          {showAllDetails ? "Hide All Details" : "Show All Details"}
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedSuppliers.map((supplier) => {
          const showDetails = showAllDetails || expandedCards[supplier.id];

          return (
            <div key={supplier.id} className="p-4 border rounded-xl shadow-sm bg-white flex flex-col space-y-4 text-sm">
              {/* Header */}
              <div className="bg-yellow-50 p-3 rounded flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-yellow-900 flex items-center">
                    <Building className="mr-2 text-yellow-700" size={18} />
                    {supplier.name || "Unknown"}
                  </h3>
                  <p className="text-xs text-gray-600 pl-6">
                    Contact: {supplier.contactPerson || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => toggleCard(supplier.id)}
                  className="flex items-center gap-1 text-xs bg-gray-100 border rounded px-2 py-1 hover:bg-gray-200"
                >
                  {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showDetails ? "Hide" : "Show"}
                </button>
              </div>

              {/* Details */}
              {showDetails && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field icon={User} label="Contact Person" value={supplier.contactPerson} />
                    <Field icon={MapPin} label="Country" value={supplier.country} />
                    <Field icon={Phone} label="Phone" value={supplier.phoneNumber} />
                    <Field icon={Mail} label="Email" value={supplier.email} />
                    <Field icon={Globe} label="Website" value={supplier.website} />
                    <Field icon={FileText} label="Invoice / PO" value={supplier.invoicePONumber} />
                    <Field icon={MapPin} label="Address" value={supplier.address} />
                  </div>

                  <div className="flex items-start gap-2 bg-blue-50 p-2 rounded mt-2">
                    <Info className="text-blue-700 mt-1" size={16} />
                    <div>
                      <strong>Notes:</strong>
                      <p className="text-gray-800 whitespace-pre-wrap">{supplier.notes || "-"}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-center pt-2">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSchedule(supplier)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                  >
                    📅 Schedule
                  </button>
                  <button
                    onClick={() => handleRetire(supplier)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  >
                    💤 Retire
                  </button>
                  <button
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-2 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-2 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50">
          <div className="bg-white border rounded-xl shadow-md p-6 w-full max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>

            <EditSupplierForm
              defaultValues={editingSupplier}
              countryData={countryData}
              onClose={() => setShowEditModal(false)}
              onUpdated={(updated) => {
                fetchSuppliers(); // ✅ Refetch updated data
                setShowEditModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Field block
const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
    <Icon size={16} className="text-gray-700" />
    <span><strong>{label}:</strong> {value || "-"}</span>
  </div>
);

export default SupplierCardView;
