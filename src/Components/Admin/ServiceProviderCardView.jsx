import React, { useState, useEffect } from "react";
import {
  Search, Eye, EyeOff, Pencil, ChevronLeft, ChevronRight, MapPin, User, Phone,
  Mail, Globe, FileText, BadgeCheck, Info, Calendar, Trash2
} from "lucide-react";
import axios from "../../api/axios";
import EditServiceProviderForm from "./EditServiceProviderForm";

const ITEMS_PER_PAGE = 6;

const reverseAccreditationMap = {
  ISO_IEC_17025: "ISO/IEC 17025",
  NABL: "NABL",
  NONE: "None",
};

const ServiceProviderCardView = ({ onUpdate = () => {}, countryData = [] }) => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllDetails, setShowAllDetails] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const deleteServiceProvider = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service provider?")) return;
    try {
      await axios.delete(`/service-providers/${id}`);
      setServiceProviders((prev) => prev.filter((p) => p.id !== id && p._id !== id));
    } catch (error) {
      console.error("Error deleting service provider:", error);
      alert("Failed to delete service provider. Please try again.");
    }
  };

  useEffect(() => {
    fetchServiceProviders();
  }, []);

  const fetchServiceProviders = async () => {
    try {
      const response = await axios.get("/service-providers");
      setServiceProviders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching service providers:", error);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = serviceProviders.filter((provider) =>
    (provider.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (provider.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedProviders = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Search + Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <Search className="text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by name or contact person..."
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
        {paginatedProviders.map((provider) => {
          const showDetails = showAllDetails || expandedCards[provider.id];

          return (
            // ✅ Fixed card: consistent height + buttons at bottom
            <div 
              key={provider.id} 
              className="p-4 border rounded-xl shadow-sm bg-white flex flex-col justify-between"
            >
              {/* Header */}
              <div className="bg-green-50 p-3 rounded flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-green-900 flex items-center">
                    <User className="mr-2 text-green-700" size={18} />
                    {provider.name || "Unknown"}
                  </h3>
                  <p className="text-xs text-gray-600 pl-6">Contact: {provider.contactPerson || "N/A"}</p>
                </div>
                <button
                  onClick={() => toggleCard(provider.id)}
                  className="flex items-center gap-1 text-xs bg-gray-100 border rounded px-2 py-1 hover:bg-gray-200"
                >
                  {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showDetails ? "Hide" : "Show"}
                </button>
              </div>

              {/* Details */}
              {showDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  <Field icon={BadgeCheck} label="Service Provider Type" value={provider.serviceProviderType || "-"} />
                  <Field icon={User} label="Contact Person" value={provider.contactPerson} />
                  <Field icon={MapPin} label="Country" value={provider.country} />
                  <Field icon={Phone} label="Phone" value={provider.phoneNumber} />
                  <Field icon={Mail} label="Email" value={provider.email} />
                  <Field icon={Globe} label="Website" value={provider.website} />
                  <Field icon={BadgeCheck} label="Accreditation" value={provider.accreditationNumber} />
                  <Field icon={FileText} label="Certificate File" value={provider.certificate?.name || "-"} />
                  <Field icon={MapPin} label="Address" value={provider.address} />
                </div>
              )}

              {/* Notes */}
              {showDetails && (
                <div className="flex items-start gap-2 bg-blue-50 p-2 rounded mt-2">
                  <Info className="text-blue-700 mt-1" size={16} />
                  <div>
                    <strong>Notes:</strong>
                    <p className="text-gray-800 whitespace-pre-wrap">{provider.description || "-"}</p>
                  </div>
                </div>
              )}

              {/* ✅ Fixed Buttons: aligned, same height, with icons */}
              <div className="flex justify-between gap-2 pt-3 mt-auto">

                <button
                  onClick={() => deleteServiceProvider(provider.id || provider._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    setEditingProvider(provider);
                    setShowEditModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
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
          <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
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
      {showEditModal && editingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50">
          <div className="bg-white border rounded-xl shadow-md p-6 w-full max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>
            <EditServiceProviderForm
              defaultValues={{
                id: editingProvider.id || editingProvider._id,
                serviceProviderName: editingProvider.name,
                serviceContact: editingProvider.contactPerson,
                serviceCountry: editingProvider.country,
                servicePhone: editingProvider.phoneNumber,
                serviceEmail: editingProvider.email,
                serviceWebsite: editingProvider.website,
                serviceAccreditation: editingProvider.accreditationNumber,
                serviceProviderType: editingProvider.serviceProviderType || "",
                serviceAddress: editingProvider.address,
                serviceCertificate: editingProvider.certificate,
                serviceNotes: editingProvider.description
              }}
              countryData={countryData}
              onClose={() => setShowEditModal(false)}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 bg-gray-50 px-3 py-2 rounded">
    <Icon size={16} className="text-gray-700 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <span className="font-medium">{label}:</span>{" "}
      <span className="text-gray-800 break-words hyphens-auto">
        {value || "-"}
      </span>
    </div>
  </div>
);

export default ServiceProviderCardView;