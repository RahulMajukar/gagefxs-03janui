// src/Pages/DepartmentDash/GageCardView.jsx
import React, { useState, useEffect } from "react";
import {
  Tag, MapPin, Search, Eye, EyeOff, FileText,
  ShieldCheck, BarChart, ChevronLeft, ChevronRight,
  CheckCircle, Download, X, Image as ImageIcon,
  ChevronLeft as LeftIcon, ChevronRight as RightIcon,
  Video, Play, ArrowUpDown, Settings, ClipboardCheck,
  Ruler, Building, Hash, Calendar, Clock, Users,
  AlertCircle, Info, Upload, FileBarChart, TrendingUp,
  PictureInPicture, QrCode, Barcode
} from "lucide-react";
import EditGage from "./EditGage";
import GRRForm from "./GRRForm";
 
// Helper functions
function byteArrayToBase64(byteArray) {
  if (!byteArray) return null;
  let binary = "";
  const bytes = new Uint8Array(byteArray);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
 
const ITEMS_PER_PAGE = 6;
 
// Compact Header Component (No images at all)
const CompactHeader = ({ gage, showDetails, toggleCard }) => {
  return (
    <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
      {/* Row 1: Compact Info */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 border border-blue-200 rounded">
            <Ruler size={12} className="text-blue-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {gage.gageType?.name || "Unknown Type"}
            </h3>
            <p className="font-semibold text-gray-900 text-sm">
              {gage.serialNumber || "Serial: N/A"}
            </p>
          </div>
        </div>
       
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
            gage.status === "ACTIVE" ? "bg-green-100 text-green-800 border border-green-200" :
            gage.status === "RETIRED" ? "bg-gray-100 text-gray-800 border border-gray-300" :
            gage.status === "DUE" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
            gage.status === "OVERDUE" ? "bg-red-100 text-red-800 border border-red-200" :
            "bg-blue-100 text-blue-800 border border-blue-200"
          }`}>
            {gage.status || "UNKNOWN"}
          </span>
         
          <button
            onClick={() => toggleCard(gage.id)}
            className={`p-1 rounded ${showDetails ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={showDetails ? "Hide details" : "Show details"}
          >
            {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
 
      {/* Location Info */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <MapPin size={12} className="text-gray-900" />
        <span className="truncate">{gage.location || "Not set"}</span>
      </div>
    </div>
  );
};
 
// Field Component
const Field = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
  <div className="bg-gray-50 p-1.5 rounded">
    <div className="flex items-center gap-1 mb-0.5">
      <Icon size={12} className={color} />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
    <div className="text-xs text-gray-900 ml-4 truncate">{value || "-"}</div>
  </div>
);
 
// GRR Form Modal Component
const GRRFormModal = ({ gage, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studyDate: new Date().toISOString().split('T')[0],
    gageId: gage.id,
    gageName: gage.gageType?.name || gage.serialNumber || 'Unknown',
    studyType: 'GRR',
    numberOfParts: 10,
    numberOfOperators: 3,
    numberOfTrials: 3,
    tolerance: '',
    comments: '',
    results: {
      repeatability: '',
      reproducibility: '',
      grr: '',
      ndc: ''
    }
  });
 
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
 
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-8 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto m-4 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-200 to-green-300 rounded-lg">
              <FileBarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">GRR Study Form</h2>
              <p className="text-gray-600 text-sm">
                Gage: <span className="font-semibold">{gage.gageType?.name || 'Unknown'}</span> •
                Serial: <span className="font-semibold">{gage.serialNumber || 'N/A'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
 
        <div className="p-6">
          <GRRForm
            gageData={gage}
            initialData={formData}
            onClose={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
 
// Main Component
const GageCardView = ({
  gages = [],
  onEdit,
  onRetire,
  selectedGage,
  setSelectedGage,
  onUpdated,
  externalScanResult,
  onClearScan
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingGage, setEditingGage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGRRModal, setShowGRRModal] = useState(false);
  const [selectedGageForGRR, setSelectedGageForGRR] = useState(null);
  const [manualPreviewUrl, setManualPreviewUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [downloadedCards, setDownloadedCards] = useState({});
  const [sortOrder, setSortOrder] = useState("newest");
 
  useEffect(() => {
    if (externalScanResult?.serialNumber) {
      setSearchTerm(externalScanResult.serialNumber);
      setCurrentPage(1);
    }
  }, [externalScanResult]);
 
  const sortedGages = [...gages].sort((a, b) => {
    const dateA = a.createdDate || a.purchaseDate || a.id;
    const dateB = b.createdDate || b.purchaseDate || b.id;
    if (sortOrder === "newest") {
      return new Date(dateB) - new Date(dateA) || b.id - a.id;
    } else {
      return new Date(dateA) - new Date(dateB) || a.id - b.id;
    }
  });
 
  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };
 
  const toggleAllCards = () => {
    if (showAllDetails) {
      setExpandedCards({});
    } else {
      const allExpanded = {};
      paginatedGages.forEach(gage => {
        allExpanded[gage.id] = true;
      });
      setExpandedCards(allExpanded);
    }
    setShowAllDetails(!showAllDetails);
  };
 
  const handleDownload = (gage, imageBase64, type) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `${type}_${gage.serialNumber || gage.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedCards((prev) => ({ ...prev, [`${gage.id}-${type}`]: true }));
    setTimeout(() => {
      setDownloadedCards((prev) => ({ ...prev, [`${gage.id}-${type}`]: false }));
    }, 2000);
  };
 
  const handleGageStudyClick = (gage) => {
    setSelectedGageForGRR(gage);
    setShowGRRModal(true);
  };
 
  const handleGRRSubmit = (formData) => {
    console.log('GRR Study Submitted:', formData);
    alert('GRR study submitted successfully!');
    setShowGRRModal(false);
  };
 
  const filteredGages = searchTerm.trim() === ""
    ? sortedGages
    : sortedGages.filter((gage) =>
        (gage.gageType?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gage.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
 
  const totalPages = Math.ceil(filteredGages.length / ITEMS_PER_PAGE);
  const paginatedGages = filteredGages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
 
  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={16} />
              <input
                type="text"
                placeholder="Search by gage type or serial number..."
                className="w-full pl-10 pr-4 py-1.5 border border-blue-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  if (externalScanResult) onClearScan?.();
                }}
              />
            </div>
          </div>
         
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-blue-300">
              <ArrowUpDown size={14} className="text-blue-500" />
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm border-0 bg-transparent focus:ring-0"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
           
            <button
              onClick={toggleAllCards}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              title={showAllDetails ? "Hide all details" : "Show all details"}
            >
              {showAllDetails ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAllDetails ? "Hide All" : "Show All"}
            </button>
          </div>
        </div>
      </div>
 
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedGages.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500 bg-white rounded-lg border p-4">
            <Search size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No gages found matching your search</p>
          </div>
        ) : (
          paginatedGages.map((gage) => {
            const showDetails = showAllDetails || expandedCards[gage.id];
           
            let manualUrl = null;
            if (gage.gageManual) {
              const base64Manual = typeof gage.gageManual === "string" ? gage.gageManual : byteArrayToBase64(gage.gageManual);
              if (base64Manual) {
                const byteCharacters = atob(base64Manual);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "application/pdf" });
                manualUrl = URL.createObjectURL(blob);
              }
            }
 
            const barcodeBase64 = typeof gage.barcodeImage === "string" ? gage.barcodeImage : null;
            const qrCodeBase64 = typeof gage.qrCodeImage === "string" ? gage.qrCodeImage : null;
 
            return (
              <div key={gage.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Header Section - No images shown */}
                <CompactHeader
                  gage={gage}
                  showDetails={showDetails}
                  toggleCard={toggleCard}
                />
 
                {/* QR/Barcode Section - Compact with Download Icons */}
                {(barcodeBase64 || qrCodeBase64) && (
                  <div className="p-2 border-b bg-gray-50">
                    <div className="flex justify-center gap-2">
                      {barcodeBase64 && (
                        <button
                          onClick={() => handleDownload(gage, barcodeBase64, 'Barcode')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          title="Download Barcode"
                        >
                          <Barcode size={12} />
                          <Download size={10} />
                        </button>
                      )}
                      {qrCodeBase64 && (
                        <button
                          onClick={() => handleDownload(gage, qrCodeBase64, 'QRCode')}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          title="Download QR Code"
                        >
                          <QrCode size={12} />
                          <Download size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
 
                {/* DETAILS SECTION */}
                {showDetails && (
                  <div className="p-3 border-b">
                    <div className="grid grid-cols-2 gap-2">
                      <Field icon={BarChart} label="Sub Type" value={gage.gageSubType?.name || gage.gageSubType} />
                      <Field icon={ShieldCheck} label="Manufacturer" value={gage.manufacturerName} />
                      <Field icon={Hash} label="Model" value={gage.modelNumber} />
                      <Field icon={Ruler} label="Range" value={gage.measurementRange} />
                      <Field icon={CheckCircle} label="Accuracy" value={gage.accuracy} />
                      <Field icon={Calendar} label="Purchase Date" value={gage.purchaseDate} />
                      <Field icon={Clock} label="Cal Interval" value={gage.calibrationInterval ? `${gage.calibrationInterval}m` : "-"} />
                      <Field icon={Users} label="Usage Freq" value={gage.usageFrequency} />
                      <Field icon={AlertCircle} label="Criticality" value={gage.criticality} />
                      <Field icon={Calendar} label="Next Cal" value={gage.nextCalibrationDate} />
                     
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-1.5 rounded">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Clock size={12} className="text-blue-500" />
                            <span className="text-xs font-medium">Remaining Days</span>
                          </div>
                          <div className={`text-sm font-bold ml-4 ${
                            (gage.remainingDays || 0) <= 7 ? "text-red-600" :
                            (gage.remainingDays || 0) <= 30 ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {gage.remainingDays || 0}
                          </div>
                        </div>
                       
                        <div className="bg-gray-50 p-1.5 rounded">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Users size={12} className="text-orange-500" />
                            <span className="text-xs font-medium">Usage</span>
                          </div>
                          <div className="text-sm font-bold ml-4 text-gray-900">
                            {gage.currentUsers !== undefined ? `${gage.currentUsers}/${gage.maxUsersNumber}` : gage.maxUsersNumber || "-"}
                          </div>
                        </div>
                      </div>
                     
                      {/* GRR Study Status */}
                      {gage.grrStudy && (
                        <div className="col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-1.5 rounded border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <FileBarChart size={12} className="text-green-600" />
                              <span className="text-xs font-medium text-green-800">GRR Study</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                gage.grrStudy.status === 'PASS' ? 'bg-green-100 text-green-800' :
                                gage.grrStudy.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {gage.grrStudy.status}
                              </span>
                              <span className="text-xs text-gray-600">
                                GRR: {gage.grrStudy.grr || 'N/A'}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                     
                      {manualUrl && (
                        <div className="col-span-2 bg-gray-50 p-1.5 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Upload size={12} className="text-gray-600" />
                            <span className="text-xs font-medium">Gage Manual</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setManualPreviewUrl(manualUrl)}
                              className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700"
                            >
                              Preview
                            </button>
                            <a
                              href={manualUrl}
                              download
                              className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                     
                      {gage.notes && (
                        <div className="col-span-2 bg-purple-50 p-1.5 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Info size={12} className="text-purple-600" />
                              <span className="text-xs font-medium">Notes</span>
                            </div>
                            <button
                              onClick={() => setSelectedGage({ ...gage, showNotes: true })}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View All
                            </button>
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-2">{gage.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
 
                {/* Action Buttons */}
                <div className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingGage(gage);
                        setShowEditModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-300 text-black py-1.5 rounded hover:bg-blue-100 text-sm font-medium"
                    >
                      <Settings size={12} />
                      Manage
                    </button>
                    <button
                      onClick={() => handleGageStudyClick(gage)}
                      className="flex-1 flex items-center justify-center gap-1 bg-yellow-100 text-black py-1.5 rounded hover:bg-yellow-50 text-sm font-medium"
                    >
                      <ClipboardCheck size={12} />
                      Gage Study
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
 
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-1 text-sm bg-blue-50 rounded">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
 
      {/* Modals */}
      {showEditModal && editingGage && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-16 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-auto m-4">
            <EditGage
              gage={editingGage}
              onCancel={() => setShowEditModal(false)}
              onUpdated={(updatedGage) => {
                onUpdated(updatedGage);
                setShowEditModal(false);
              }}
            />
          </div>
        </div>
      )}
 
      {/* GRR Form Modal */}
      {showGRRModal && selectedGageForGRR && (
        <GRRFormModal
          gage={selectedGageForGRR}
          onClose={() => {
            setShowGRRModal(false);
            setSelectedGageForGRR(null);
          }}
          onSubmit={handleGRRSubmit}
        />
      )}
 
      {manualPreviewUrl && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-4/5 h-4/5 m-4">
            <iframe src={manualPreviewUrl} className="w-full h-full" />
            <button
              onClick={() => setManualPreviewUrl(null)}
              className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
 
      {selectedGage?.showNotes && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl m-4">
            <h3 className="text-sm font-semibold mb-3">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{selectedGage.notes}</p>
            <button
              onClick={() => setSelectedGage(null)}
              className="mt-3 px-3 py-1.5 bg-gray-600 text-white rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default GageCardView;