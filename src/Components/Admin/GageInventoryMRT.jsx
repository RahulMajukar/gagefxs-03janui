// GageInventoryMRT.jsx
import React, { useState, useEffect } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip } from "@mui/material";
import { Edit, Archive } from "@mui/icons-material";
import axios from "axios";
import EditGage from "./EditGage";
import { FileText, Eye, Download, Image as ImageIcon, Video, Play, X } from "lucide-react";

const GageInventoryMRT = ({ gagesData, setGagesData, loading }) => {
  const [editingGage, setEditingGage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Media viewer states
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState('images'); // 'images' or 'videos'
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Manual viewer states
  const [selectedManualUrl, setSelectedManualUrl] = useState(null);
  const [selectedManualName, setSelectedManualName] = useState(null);
  
  // Notes viewer
  const [selectedNote, setSelectedNote] = useState(null);
  
  // ✅ Barcode viewer states
  const [selectedBarcodeUrl, setSelectedBarcodeUrl] = useState(null);
  const [selectedBarcodeSerial, setSelectedBarcodeSerial] = useState(null);
  const [selectedBarcodeBase64, setSelectedBarcodeBase64] = useState(null);

  const handleEdit = (gage) => {
    setEditingGage(gage);
    setShowEditModal(true);
  };

  const handleRetire = async (id, name) => {
    if (!window.confirm(`Are you sure you want to retire "${name}"?`)) return;
    try {
      await axios.put(
        `https://qsutrarmsclm.hub.swajyot.co.in:8446/api/gages/retire/${id}`
      );
      setGagesData((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: "RETIRED" } : g))
      );
      alert(`"${name}" has been retired.`);
    } catch (error) {
      console.error("Failed to retire gage:", error);
      alert("Failed to retire the gage.");
    }
  };

  // ✅ Helper: convert byte[] → base64
  const byteArrayToBase64 = (byteArray) => {
    if (!byteArray) return null;
    if (typeof byteArray === "string") return byteArray;
    let binary = "";
    const bytes = new Uint8Array(byteArray);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const getBase64String = (input) => {
    if (!input) return null;
    if (typeof input === "string") {
      return input.startsWith("data:") ? input.split(",")[1] : input;
    }
    return byteArrayToBase64(input);
  };

  const createBlobUrlFromBase64 = (base64, mime = "application/pdf") => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Failed to create blob url from base64:", err);
      return null;
    }
  };

  // Handle media view
  const handleViewMedia = (gage) => {
    const images = Array.isArray(gage.gageImages) ? gage.gageImages : [];
    const videos = Array.isArray(gage.gageVideos) ? gage.gageVideos : [];
    
    if (images.length === 0 && videos.length === 0) {
      alert("No media available for this gage.");
      return;
    }

    setSelectedMedia({
      images,
      videos,
      gageName: gage.gageType?.name || "Unknown Gage",
      serialNumber: gage.serialNumber || "N/A"
    });
    setCurrentMediaIndex(0);
    setMediaType(images.length > 0 ? 'images' : 'videos');
  };

  // Navigation functions for media carousel
  const nextMedia = () => {
    if (!selectedMedia) return;
    
    const currentMediaArray = mediaType === 'images' ? selectedMedia.images : selectedMedia.videos;
    setCurrentMediaIndex((prev) => 
      prev === currentMediaArray.length - 1 ? 0 : prev + 1
    );
  };

  const prevMedia = () => {
    if (!selectedMedia) return;
    
    const currentMediaArray = mediaType === 'images' ? selectedMedia.images : selectedMedia.videos;
    setCurrentMediaIndex((prev) => 
      prev === 0 ? currentMediaArray.length - 1 : prev - 1
    );
  };

  // Close media viewer
  const closeMediaViewer = () => {
    setSelectedMedia(null);
    setCurrentMediaIndex(0);
    setMediaType('images');
  };

  useEffect(() => {
    return () => {
      if (selectedManualUrl) URL.revokeObjectURL(selectedManualUrl);
      if (selectedBarcodeUrl) URL.revokeObjectURL(selectedBarcodeUrl);
    };
  }, [selectedManualUrl, selectedBarcodeUrl]);

  const columns = [
    {
      accessorKey: "gageType",
      header: "Gage Type",
      Cell: ({ row }) => row.original.gageType?.name || "-",
    },
    { accessorKey: "serialNumber", header: "Serial Number" },
    { accessorKey: "modelNumber", header: "Model Number" },
    {
      accessorKey: "manufacturerName",
      header: "OEM (Manufacturer)",
      Cell: ({ row }) => row.original.manufacturerName || "-",
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "measurementRange", header: "Measurement Range" },
    { accessorKey: "accuracy", header: "Accuracy / Resolution" },
    { accessorKey: "purchaseDate", header: "Purchase Date" },
    {
      accessorKey: "calibrationInterval",
      header: "Calibration Interval (months)",
    },
    { accessorKey: "usageFrequency", header: "Usage Frequency" },
    { accessorKey: "criticality", header: "Criticality" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "nextCalibrationDate", header: "Next Calibration Date" },
    { accessorKey: "maxUsersNumber", header: "Max Usages" },

    // ====== Media Column (Images & Videos) ======
    {
      accessorKey: "media",
      header: "Media",
      Cell: ({ row }) => {
        const gage = row.original;
        const images = Array.isArray(gage.gageImages) ? gage.gageImages : [];
        const videos = Array.isArray(gage.gageVideos) ? gage.gageVideos : [];
        const totalMedia = images.length + videos.length;

        if (totalMedia === 0) {
          return <span className="text-gray-400 text-sm">No Media</span>;
        }

        return (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip 
              title={`View ${totalMedia} media files (${images.length} photos, ${videos.length} videos)`} 
              arrow
            >
              <IconButton 
                aria-label="view-media" 
                size="small" 
                onClick={() => handleViewMedia(gage)}
                sx={{ 
                  backgroundColor: '#f0f9ff',
                  '&:hover': { backgroundColor: '#e0f2fe' }
                }}
              >
                <ImageIcon size={16} color="#0ea5e9" />
              </IconButton>
            </Tooltip>
            <span className="text-xs text-gray-600">
              {images.length > 0 && `${images.length}📷`}
              {images.length > 0 && videos.length > 0 && ' '}
              {videos.length > 0 && `${videos.length}🎥`}
            </span>
          </div>
        );
      },
    },

    // ====== Gage Manual ======
    {
      accessorKey: "gageManual",
      header: "Gage Manual",
      Cell: ({ row }) => {
        const manual = row.original.gageManual;
        if (!manual) {
          return <span className="text-gray-400 text-sm">Not Provided</span>;
        }

        const handleView = () => {
          const base64 = getBase64String(manual);
          if (!base64) return alert("Manual is not available or corrupted.");
          if (selectedManualUrl) {
            URL.revokeObjectURL(selectedManualUrl);
          }
          const blobUrl = createBlobUrlFromBase64(base64, "application/pdf");
          if (!blobUrl) return alert("Unable to open manual.");
          setSelectedManualName(`${row.original.serialNumber || "gage"}-manual.pdf`);
          setSelectedManualUrl(blobUrl);
        };

        const handleDownload = () => {
          const base64 = getBase64String(manual);
          if (!base64) return alert("Manual is not available or corrupted.");
          const blobUrl = createBlobUrlFromBase64(base64, "application/pdf");
          if (!blobUrl) return alert("Unable to download manual.");
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${row.original.serialNumber || "gage"}-manual.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(blobUrl);
        };

        return (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip title="View Manual" arrow>
              <IconButton aria-label="view-manual" size="small" onClick={handleView}>
                <Eye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Manual" arrow>
              <IconButton aria-label="download-manual" size="small" onClick={handleDownload}>
                <Download size={16} />
              </IconButton>
            </Tooltip>
          </div>
        );
      },
    },

    // ====== ✅ Barcode Column (Full parity with GageCardView) ======
    {
      accessorKey: "barcodeImage",
      header: "Barcode",
      Cell: ({ row }) => {
        const barcode = row.original.barcodeImage;
        if (!barcode) {
          return <span className="text-gray-400 text-sm">Not Available</span>;
        }

        const base64 = getBase64String(barcode);
        if (!base64) {
          return <span className="text-gray-400 text-sm">Invalid</span>;
        }

        const handleView = () => {
          const blobUrl = createBlobUrlFromBase64(base64, "image/png");
          if (!blobUrl) return alert("Unable to display barcode.");
          setSelectedBarcodeUrl(blobUrl);
          setSelectedBarcodeSerial(row.original.serialNumber || row.original.id);
          setSelectedBarcodeBase64(base64); // ✅ store for modal download
        };

        const handleDownload = () => {
          const dataUrl = `data:image/png;base64,${base64}`;
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `Barcode_${row.original.serialNumber || row.original.id}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        };

        return (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip title="View Barcode" arrow>
              <IconButton aria-label="view-barcode" size="small" onClick={handleView}>
                <Eye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Barcode" arrow>
              <IconButton aria-label="download-barcode" size="small" onClick={handleDownload}>
                <Download size={16} />
              </IconButton>
            </Tooltip>
          </div>
        );
      },
    },

    { accessorKey: "status", header: "Status" },

    // ====== Notes ======
    {
      accessorKey: "notes",
      header: "Notes",
      Cell: ({ row }) =>
        row.original.notes ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            onClick={() => setSelectedNote(row.original.notes)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setSelectedNote(row.original.notes); }}
          >
            <FileText size={16} />
            <span style={{ color: "#0B5394", textDecoration: "underline" }}>View</span>
          </div>
        ) : (
          "-"
        ),
    },

    // ====== Actions ======
    {
      header: "Actions",
      Cell: ({ row }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(row.original)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retire">
            <IconButton
              color="warning"
              onClick={() => handleRetire(row.original.id, row.original.gageType?.name)}
            >
              <Archive />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <MaterialReactTable
        columns={columns}
        data={gagesData}
        state={{ isLoading: loading }}
        enableColumnResizing
        enableStickyHeader
        enableGlobalFilter
        muiTableContainerProps={{ sx: { maxHeight: 600 } }}
        muiTableBodyRowProps={{ sx: { height: 36 } }}
        muiTableBodyCellProps={{ sx: { py: 0.5, px: 1 } }}
        muiTableHeadCellProps={{
          sx: {
            py: 0.5,
            px: 1,
            fontSize: "0.8rem",
            borderBottom: "2px solid #004377",
            borderTop: "2px solid #004377",
          },
        }}
      />

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeMediaViewer}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#005797] text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{selectedMedia.gageName}</h3>
                <p className="text-sm opacity-90">Serial: {selectedMedia.serialNumber}</p>
              </div>
              <button
                onClick={closeMediaViewer}
                className="text-white text-2xl hover:text-gray-200"
              >
                &times;
              </button>
            </div>

            {/* Media Content */}
            <div className="p-6">
              {/* Media Type Toggle */}
              {selectedMedia.images.length > 0 && selectedMedia.videos.length > 0 && (
                <div className="flex justify-center mb-1">
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => {
                        setMediaType('images');
                        setCurrentMediaIndex(0);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mediaType === 'images' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ImageIcon size={16} className="inline mr-2" />
                      Photos ({selectedMedia.images.length})
                    </button>
                    <button
                      onClick={() => {
                        setMediaType('videos');
                        setCurrentMediaIndex(0);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mediaType === 'videos' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Video size={16} className="inline mr-2" />
                      Videos ({selectedMedia.videos.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Current Media Display */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                {mediaType === 'images' && selectedMedia.images.length > 0 ? (
                  <>
                    <img
                      src={`data:image/jpeg;base64,${selectedMedia.images[currentMediaIndex]}`}
                      alt={`Gage image ${currentMediaIndex + 1}`}
                      className="w-full h-96 object-contain"
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedMedia.images.length > 1 && (
                      <>
                        <button
                          onClick={prevMedia}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={nextMedia}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </>
                ) : mediaType === 'videos' && selectedMedia.videos.length > 0 ? (
                  <>
                    <div className="w-full h-96 bg-gray-800 flex items-center justify-center relative">
                      <video
                        src={`data:video/webm;base64,${selectedMedia.videos[currentMediaIndex]}`}
                        controls
                        className="max-w-full max-h-full"
                      />
                      
                      {/* Navigation Arrows */}
                      {selectedMedia.videos.length > 1 && (
                        <>
                          <button
                            onClick={prevMedia}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={nextMedia}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-white">
                    No media available
                  </div>
                )}

                {/* Media Counter */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                  {currentMediaIndex + 1} / {mediaType === 'images' ? selectedMedia.images.length : selectedMedia.videos.length}
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-4 right-4">
                  {mediaType === 'images' ? (
                    <div className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2">
                      <ImageIcon size={16} />
                      Photo
                    </div>
                  ) : (
                    <div className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2">
                      <Video size={16} />
                      Video
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-center mt-2">
                {mediaType === 'images' && selectedMedia.images.length > 0 && (
                  <a
                    href={`data:image/jpeg;base64,${selectedMedia.images[currentMediaIndex]}`}
                    download={`${selectedMedia.serialNumber}_image_${currentMediaIndex + 1}.jpg`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Image
                  </a>
                )}
                {mediaType === 'videos' && selectedMedia.videos.length > 0 && (
                  <a
                    href={`data:video/webm;base64,${selectedMedia.videos[currentMediaIndex]}`}
                    download={`${selectedMedia.serialNumber}_video_${currentMediaIndex + 1}.webm`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {selectedManualUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            URL.revokeObjectURL(selectedManualUrl);
            setSelectedManualUrl(null);
            setSelectedManualName(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[85vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                URL.revokeObjectURL(selectedManualUrl);
                setSelectedManualUrl(null);
                setSelectedManualName(null);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl z-30"
            >
              &times;
            </button>
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-medium">{selectedManualName || "Manual"}</div>
              <div>
                <a
                  href={selectedManualUrl}
                  download={selectedManualName || "manual.pdf"}
                  className="mr-2 px-3 py-1 rounded bg-green-600 text-white text-sm"
                >
                  Download
                </a>
                <a
                  href={selectedManualUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                >
                  Open in new tab
                </a>
              </div>
            </div>
            <iframe
              src={selectedManualUrl}
              title="Gage Manual"
              className="w-full h-[calc(100%-56px)] border-0"
            />
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-[#005797] rounded-t-lg">
              <h3 className="text-white font-medium text-lg">Notes</h3>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-white hover:text-gray-200 font-bold text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {selectedNote}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Barcode Modal (Full functionality) */}
      {selectedBarcodeUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            URL.revokeObjectURL(selectedBarcodeUrl);
            setSelectedBarcodeUrl(null);
            setSelectedBarcodeSerial(null);
            setSelectedBarcodeBase64(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-indigo-600 text-white py-3 px-5 text-center font-medium text-lg">
              View Barcode
            </div>

            {/* Close */}
            <button
              onClick={() => {
                URL.revokeObjectURL(selectedBarcodeUrl);
                setSelectedBarcodeUrl(null);
                setSelectedBarcodeSerial(null);
                setSelectedBarcodeBase64(null);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              &times;
            </button>

            {/* Image */}
            <div className="p-6 flex justify-center">
              <img
                src={selectedBarcodeUrl}
                alt="Barcode Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>

            {/* ✅ Download in Modal */}
            {selectedBarcodeBase64 && (
              <div className="absolute bottom-4 right-4">
                <a
                  href={`data:image/png;base64,${selectedBarcodeBase64}`}
                  download={`Barcode_${selectedBarcodeSerial}.png`}
                  className="relative group"
                >
                  <Download className="w-8 h-8 text-white bg-indigo-800 hover:text-white cursor-pointer rounded-lg" />
                  <span className="absolute -top-8 left-1 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Download
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingGage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="relative bg-white p-6 max-w-5xl w-full rounded shadow-xl mt-10 mb-10 max-h-screen overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>
            <EditGage
              gage={editingGage}
              onCancel={() => setShowEditModal(false)}
              onUpdated={(updatedGage) => {
                setGagesData((prev) => prev.map((g) => (g.id === updatedGage.id ? updatedGage : g)));
                setShowEditModal(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GageInventoryMRT;