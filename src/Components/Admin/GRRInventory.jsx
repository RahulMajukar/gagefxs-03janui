import React, { useState, useEffect } from "react";
import { BarChart, Target, Calendar, CheckCircle, XCircle, Clock, Download, Filter, Eye, FileText } from "lucide-react";
import api from "../../api/axios";
import GRRPreview from "./GRRPreview";

const GRRInventory = ({ isOpen, onClose }) => {
  const [grrStudies, setGrrStudies] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewStudy, setPreviewStudy] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGRRStudies();
    }
  }, [isOpen]);

  const fetchGRRStudies = async () => {
    try {
      setLoading(true);
      const response = await api.get("/grr");
      setGrrStudies(response.data || []);
    } catch (err) {
      console.error("Error fetching GR&R studies:", err);
      setGrrStudies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudies = grrStudies.filter(study => {
    const matchesStatus = filterStatus === "ALL" || study.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      (study.studyName && study.studyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (study.partNumber && study.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (study.gageNumber && study.gageNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASSED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'MARGINAL': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'MARGINAL': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePreview = async (studyId) => {
    try {
      const response = await api.get(`/grr/${studyId}`);
      setPreviewStudy(response.data);
      setShowPreview(true);
    } catch (err) {
      console.error("Error fetching study details:", err);
      alert("Failed to load study details");
    }
  };

  const handleDownloadPDF = async (studyId) => {
    try {
      const response = await api.get(`/grr/${studyId}`);
      const study = response.data;
      
      // Import PDF utilities dynamically
      const { generateGRRPDF } = await import("../../utils/pdfGenerator");
      generateGRRPDF(study);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">GR&R Studies Inventory</h2>
                <p className="text-gray-600">Measurement System Analysis Studies</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search studies..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['ALL', 'PASSED', 'FAILED', 'MARGINAL', 'PENDING'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg border ${filterStatus === status ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Studies List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading studies...</p>
                </div>
              ) : filteredStudies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No GR&R studies found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredStudies.map(study => (
                    <div key={study.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{study.studyName || study.gageNumber}</h3>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {study.partNumber && (
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Target className="w-4 h-4" /> {study.partNumber}
                              </span>
                            )}
                            {study.characteristic && (
                              <span className="text-sm text-gray-600">
                                Characteristic: {study.characteristic}
                              </span>
                            )}
                            {study.studyDate && (
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {new Date(study.studyDate).toLocaleDateString()}
                              </span>
                            )}
                            {study.gageNumber && (
                              <span className="text-sm text-gray-600">
                                Gage: {study.gageNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(study.status)} flex items-center gap-1`}>
                            {getStatusIcon(study.status)} {study.status}
                          </span>
                          {study.percentGRR !== null && study.percentGRR !== undefined && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              study.percentGRR <= 10 ? 'bg-green-100 text-green-800' :
                              study.percentGRR <= 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {study.percentGRR.toFixed(2)}% GR&R
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Study Details */}
                      {(study.equipmentVariation !== null || study.appraiserVariation !== null) && (
                        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                          {study.equipmentVariation !== null && (
                            <div>
                              <span className="text-gray-500">EV:</span>
                              <span className="ml-2 font-medium">{study.equipmentVariation.toFixed(5)}</span>
                            </div>
                          )}
                          {study.appraiserVariation !== null && (
                            <div>
                              <span className="text-gray-500">AV:</span>
                              <span className="ml-2 font-medium">{study.appraiserVariation.toFixed(5)}</span>
                            </div>
                          )}
                          {study.grrValue !== null && (
                            <div>
                              <span className="text-gray-500">GR&R:</span>
                              <span className="ml-2 font-medium">{study.grrValue.toFixed(5)}</span>
                            </div>
                          )}
                          {study.numberOfDistinctCategories !== null && (
                            <div>
                              <span className="text-gray-500">NDC:</span>
                              <span className="ml-2 font-medium">{study.numberOfDistinctCategories}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handlePreview(study.id)}
                          className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        {/* <button
                          onClick={() => handleDownloadPDF(study.id)}
                          className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-1 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {filteredStudies.length} of {grrStudies.length} studies
              </div>
              <div className="flex gap-3">
                <button onClick={fetchGRRStudies} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Refresh
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewStudy && (
        <GRRPreview
          study={previewStudy}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewStudy(null);
          }}
          onDownloadPDF={() => handleDownloadPDF(previewStudy.id)}
        />
      )}
    </>
  );
};

export default GRRInventory;
