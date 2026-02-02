// src/Components/forum/ThreadCard.jsx
import React, { useState } from "react";
import {
  User,
  MapPin,
  Calendar,
  Download,
  FileText,
  Check,
  RefreshCw,
  Mic,
  AlertCircle,
} from "lucide-react";
import { downloadForumAttachment } from "../../api/api";

// In ThreadCard.jsx, modify the formatTime function
const formatTime = (dateString) => {
  let date;
  try {
    // First, try to parse as a standard ISO string
    date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  } catch (e) {
    // If parsing fails, use a fallback (e.g., current time or a default string)
    console.error("Failed to parse date:", dateString, e);
    date = new Date(); // Fallback to current time
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Convert Base64 to blob URL for media playback
const base64ToBlobUrl = (base64, mimeType) => {
  if (!base64) {
    console.warn("base64ToBlobUrl: No base64 data provided");
    return "";
  }

  try {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    return url;
  } catch (e) {
    console.error("Failed to convert Base64 to blob:", e, base64.substring(0, 50));
    return "";
  }
};

export default function ThreadCard({ thread, currentUsername, currentUser, onRetry }) {
  
  const [imageModal, setImageModal] = useState({ open: false, url: "" });
  const isOwnMessage = thread.createdBy === currentUsername;

  const openImageModal = (url) => setImageModal({ open: true, url });
  const closeImageModal = () => setImageModal({ open: false, url: "" });

  const handleFileDownload = async (attachment) => {
    if (attachment.fileData) {
      // Handle Base64-encoded files
      const mimeType = attachment.fileType || "application/octet-stream";
      const blobUrl = base64ToBlobUrl(attachment.fileData, mimeType);
      if (!blobUrl) return;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", attachment.fileName || "file");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } else if (attachment.id) {
      // Handle server-stored files
      try {
        const blob = await downloadForumAttachment(attachment.id, "blob");
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", attachment.fileName || "file");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download file");
      }
    }
  };

  const renderAttachment = (attachment, index) => {
    const { attachmentType, fileName, fileSize, fileData, fileType, id } = attachment;
    const mimeType = fileType || "application/octet-stream";

    // Determine source URL
    let srcUrl = "";
    if (fileData) {
      if (attachmentType === "IMAGE") {
        srcUrl = `data:${mimeType};base64,${fileData}`;
      } else {
        srcUrl = base64ToBlobUrl(fileData, mimeType);
      }
    } else if (id) {
      srcUrl = `/api/forum/attachments/${id}`;
    }

    switch (attachmentType) {
      case "IMAGE":
        return (
          <div key={index} className="mt-2">
            <img
              src={srcUrl}
              alt={fileName}
              className="max-w-xs rounded-lg cursor-pointer border"
              onClick={() => openImageModal(srcUrl)}
              />
          </div>
        );
        
        case "VIDEO":
          console.log("Rendering VIDEO attachment:", {
            fileName,
            fileSize,
            fileData: fileData ? `${fileData.substring(0, 50)}...` : 'undefined',
            fileType,
            id,
          });
          return (
            <div key={index} className="mt-2">
      <video
        controls
        className="max-w-xs rounded-lg"
        src={srcUrl}
        // onClick={() => openImageModal(srcUrl)}
      />
    </div>
  );

      case "AUDIO":
        return (
          <div key={index} className="mt-2">
            <audio controls src={srcUrl} />
          </div>
        );

      case "LOCATION": {
        let locData = null;
        if (fileData) {
          try {
            locData = JSON.parse(atob(fileData));
          } catch (e) {
            console.warn("Invalid location data", fileData);
          }
        }
        const mapUrl = locData?.url || thread.content || "#";
        return (
          <div key={index} className="mt-2 p-2 bg-blue-50 rounded border">
              <span className="text-sm">Location shared</span>
            <div className="mt-1 text-xs text-blue-700">
              <MapPin size={14} className="inline mr-1" />
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on map
              </a>
            </div>
          </div>
        );
      }

      case "EVENT": {
        let eventData = null;
        if (fileData) {
          try {
            eventData = JSON.parse(atob(fileData));
          } catch (e) {
            console.warn("Invalid event data", fileData);
          }
        }
        const title = eventData?.title || "Event";
        const datetime = eventData?.datetime
          ? new Date(eventData.datetime).toLocaleString()
          : "No date";

        return (
          <div key={index} className="mt-2 p-2 bg-purple-50 rounded border">
            <Calendar size={14} className="inline mr-1" />
            <div className="text-sm">
              <strong>{title}</strong>
              <br />
              <span className="text-xs text-gray-600">{datetime}</span>
            </div>
          </div>
        );
      }

      default:
        return (
          <div
            key={index}
            className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => handleFileDownload(attachment)}
          >
            <FileText size={16} />
            <span className="text-sm truncate flex-1">{fileName}</span>
            <span className="text-xs text-gray-500">{formatFileSize(fileSize)}</span>
            <Download size={14} />
          </div>
        );
    }
  };

  const getMessageStatus = () => {
    if (thread.failed) {
      return {
        icon: (
          <button
            onClick={() => onRetry && onRetry(thread)}
            className="text-red-500 hover:text-red-700 ml-1"
            title="Retry"
          >
            <RefreshCw size={12} />
          </button>
        ),
        text: "Failed",
      };
    }
    return {
      icon: <Check size={12} className="text-blue-500 ml-1" />,
      text: "Sent",
    };
  };

  const status = getMessageStatus();

  return (
    <>
      {/* Image Modal */}
      {imageModal.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white bg-black bg-opacity-50 rounded-full p-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img
              src={imageModal.url}
              alt="Full size"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Message Bubble */}
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 px-4`}>
        <div className={`max-w-[70%] flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} gap-2`}>
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isOwnMessage ? (
              currentUser?.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt="You"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={14} className="text-gray-600" />
                </div>
              )
            ) : thread.createdByProfileImage ? (
              <img
                src={thread.createdByProfileImage}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={14} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`rounded-2xl px-3 py-2 ${isOwnMessage ? "bg-green-100" : "bg-white border"} break-words`}>
           {!isOwnMessage && (
  <div className="text-xs text-gray-500 mb-1">
    {thread.createdByName || thread.createdBy}
  </div>
)}

            {/* Attachments */}
            {thread.attachments?.map(renderAttachment)}

            {/* Text-only content */}
            {thread.content &&
              !thread.attachments?.length &&
              thread.messageType !== "EVENT" && (
                <div 
                  className="whitespace-pre-wrap break-words overflow-hidden"
                  style={{
                    wordBreak: 'break-word',
                    wordWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: '100%'
                  }}
                >
                  {thread.content}
                </div>
              )}

            {/* Timestamp & Status */}
            <div className="flex items-center justify-end mt-1 text-xs text-gray-500">
              {formatTime(thread.createdAt)}
              {isOwnMessage && status.icon}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}