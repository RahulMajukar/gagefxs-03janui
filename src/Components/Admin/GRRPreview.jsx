import React, { useRef, useState, useEffect } from "react";
import { X, Download, Share2, Mail, MessageSquare } from "lucide-react";
import GRRResults from "./GRRResults";
import GRRCharts from "./GRRCharts";
import { calculateAppraiserStats, calculateOverallStats } from "../../utils/grrCalculations";
import HTRimage from "../../assets/HTF.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const GRRPreview = ({ study, isOpen, onClose, onDownloadPDF }) => {
  if (!isOpen || !study) return null;

  const previewRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareCC, setShareCC] = useState("");
  const [shareSubject, setShareSubject] = useState(`GRR Study Report: ${study.studyName || study.gageNumber}`);
  const [shareMessage, setShareMessage] = useState(`Please find attached the GRR Study Report for ${study.partNumber} - ${study.partName}.`);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailStatus, setMailStatus] = useState("");

  // Convert study data to formData format for components
  const formData = {
    studyName: study.studyName,
    gageNumber: study.gageNumber,
    partNumber: study.partNumber,
    partName: study.partName,
    characteristic: study.characteristic,
    lowerSpecification: study.lowerSpecification,
    upperSpecification: study.upperSpecification,
    units: study.units,
    numberOfAppraisers: study.numberOfAppraisers,
    numberOfParts: study.numberOfParts,
    numberOfTrials: study.numberOfTrials,
    studyDate: study.studyDate,
    conductedBy: study.conductedBy,
    companyName: study.companyName,
    reportTitle: study.reportTitle,
    documentNumber: study.documentNumber,
    revisionNumberDate: study.revisionNumberDate,
    pageInfo: study.pageInfo,
    measurementData: study.measurementData || {}
  };

  // Convert study results to calculationResults format
  const calculationResults = {
    equipmentVariation: study.equipmentVariation,
    appraiserVariation: study.appraiserVariation,
    grrValue: study.grrValue,
    partVariation: study.partVariation || null,
    totalVariation: study.totalVariation || null,
    percentEV: study.percentEV || null,
    percentAV: study.percentAV || null,
    percentGRR: study.percentGRR,
    percentPV: study.percentPV || null,
    numberOfDistinctCategories: study.numberOfDistinctCategories,
    averageRange: study.averageRange || null,
    xDiff: study.xDiff || null,
    rangeOfPartAverages: study.rangeOfPartAverages || null,
    k1: study.k1 || null,
    k2: study.k2 || null,
    k3: study.k3 || null,
    status: study.status
  };

  // Helper function
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Handle Share button click
  const handleShareClick = () => {
    setShowShareOptions(!showShareOptions);
  };

  // Handle Download button click - show quality options
  const handleDownloadClick = () => {
    setShowQualityOptions(!showQualityOptions);
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    const message = `GRR Study Report: ${study.studyName || study.gageNumber} - ${study.partNumber}\nDownload link: ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareOptions(false);
  };

 const [ccList, setCcList] = useState([]); 

  // --- PDF GENERATION LOGIC ---
const generatePDF = async (quality = "medium", forEmail = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - (2 * margin);
      const pageHeight = 297; // A4 height in mm

      // Quality settings
      const qualitySettings = {
        low: { scale: 1.0, jpegQuality: 0.7 },
        medium: { scale: 1.5, jpegQuality: 0.85 },
        high: { scale: 2.0, jpegQuality: 0.95 }
      };
      
      const settings = qualitySettings[quality] || qualitySettings.medium;

      // Helper to add page number
      const addPageNumber = (pageNum, totalPages) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const pageNumberText = `Page ${pageNum} of ${totalPages}`;
        const textWidth = pdf.getStringUnitWidth(pageNumberText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        const xPosition = (pageWidth - textWidth) / 2;
        pdf.text(pageNumberText, xPosition, pageHeight - 5);
      };

      // Helper to capture specific ID
      const captureSection = async (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return null;

        // Scroll element into view to ensure proper rendering
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for scroll
        
        return await html2canvas(element, {
          scale: settings.scale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById(elementId);
            if (!clonedElement) return;
            
            // Hide header buttons that shouldn't be in PDF
            const headerButtons = clonedElement.querySelectorAll('.header-buttons, button[class*="Download"], button[class*="X"], button[class*="Share"]');
            headerButtons.forEach(btn => {
              if (btn.closest('.sticky')) {
                btn.style.display = 'none';
              }
            });
            
            // Preserve all original styles - don't modify anything
            // The goal is exact pixel-perfect match to preview
            const allElements = clonedElement.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i];
              // Only hide interactive elements, preserve all visual styling
              if (el.tagName === 'BUTTON' && el.closest('.sticky')) {
                el.style.display = 'none';
              }
              // Ensure visibility but don't change any other styles
              if (el.style.visibility === 'hidden') {
                el.style.visibility = 'visible';
              }
            }
          }
        });
      };

      // First, capture all sections
      const headerCanvas = await captureSection('pdf-report-header');
      const part1Canvas = await captureSection('pdf-part-1');
      const part2Canvas = await captureSection('pdf-part-2');
      const part3Canvas = await captureSection('pdf-part-3');

      // Calculate heights
      let headerHeight = 0;
      if (headerCanvas) {
        headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
      }

      // Determine total pages based on content
      let totalPages = 1; // Always at least 1 page
      
      if (part2Canvas) totalPages++;
      if (part3Canvas) totalPages++;

      // Add page numbers as we create pages
      let currentPage = 1;

      // --- PAGE 1: Header + Part 1 ---
      let currentY = margin;

      // Add header to page 1
      if (headerCanvas) {
        pdf.addImage(headerCanvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, currentY, contentWidth, headerHeight);
        currentY += headerHeight + 2;
      }

      if (part1Canvas) {
        const part1Height = (part1Canvas.height * contentWidth) / part1Canvas.width;
        // Check if Part 1 fits on remaining page, otherwise new page
        if (currentY + part1Height > (pageHeight - 15)) { // Leave space for page number
          pdf.addPage();
          currentPage++;
          // Add header to new page if page break occurs
          if (headerCanvas) {
            pdf.addImage(headerCanvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, margin, contentWidth, headerHeight);
            currentY = margin + headerHeight + 2;
          } else {
            currentY = margin;
          }
        }
        pdf.addImage(part1Canvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, currentY, contentWidth, part1Height);
      }

      // Add page number to page 1
      addPageNumber(1, totalPages);

      // --- PAGE 2: Header + Part 2 (Results) ---
      if (part2Canvas) {
        pdf.addPage();
        currentPage++;
        let page2Y = margin;
        
        // Add header to page 2
        if (headerCanvas) {
          pdf.addImage(headerCanvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, page2Y, contentWidth, headerHeight);
          page2Y += headerHeight + 2;
        }
        
        const part2Height = (part2Canvas.height * contentWidth) / part2Canvas.width;
        // Calculate available space after header
        const availableHeight = pageHeight - page2Y - margin - 10;
        const scaledPart2Height = Math.min(part2Height, availableHeight);
        
        pdf.addImage(part2Canvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, page2Y, contentWidth, scaledPart2Height);
        
        // Add page number to page 2
        addPageNumber(2, totalPages);
      }

      // --- PAGE 3: Header + Part 3 (Charts) ---
      if (part3Canvas) {
        pdf.addPage();
        currentPage++;
        let page3Y = margin;
        
        // Add header to page 3
        if (headerCanvas) {
          pdf.addImage(headerCanvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, page3Y, contentWidth, headerHeight);
          page3Y += headerHeight + 2;
        }
        
        const part3Height = (part3Canvas.height * contentWidth) / part3Canvas.width;
        // Calculate available space after header
        const availableHeight = pageHeight - page3Y - margin - 10;
        const scaledPart3Height = Math.min(part3Height, availableHeight);
        
        pdf.addImage(part3Canvas.toDataURL('image/jpeg', settings.jpegQuality), 'JPEG', margin, page3Y, contentWidth, scaledPart3Height);
        
        // Add page number to page 3
        addPageNumber(3, totalPages);
      }

      const pdfBlob = pdf.output('blob');
      console.log(`Generated PDF (${quality} quality, ${totalPages} pages): ${(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB`);
      resolve(pdfBlob);

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};
  // Handle Download PDF with quality selection
  const handleGeneratePDF = async (quality = "medium") => {
    if (isGeneratingPDF) return;
    
    // Close quality options modal
    setShowQualityOptions(false);
    setIsGeneratingPDF(true);

    try {
      const pdfBlob = await generatePDF(quality, false);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GRR_Study_${study.studyName || study.gageNumber}_${study.partNumber}_${quality}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle Email share
  const handleSendEmail = async () => {
    if (!shareEmail.trim()) {
      setMailStatus("Please enter an email address");
      return;
    }

    setIsSendingMail(true);
    setMailStatus("Generating PDF...");

    try {
      // Generate medium quality PDF for email
      const pdfBlob = await generatePDF("medium", true);
      
      // Check file size
      const fileSizeMB = pdfBlob.size / (1024 * 1024);
      console.log(`PDF for email: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 15) {
        setMailStatus("PDF is large, optimizing...");
        // Generate low quality version if too large
        const compressedPdfBlob = await generatePDF("low", true);
        await sendEmailWithPDF(compressedPdfBlob);
      } else {
        await sendEmailWithPDF(pdfBlob);
      }
    } catch (error) {
      console.error('Error in email process:', error);
      setMailStatus(`Error: ${error.message}`);
      setIsSendingMail(false);
    }
  };

  // Helper to send email with PDF
  const sendEmailWithPDF = async (pdfBlob) => {
    setMailStatus("Preparing email...");
    
    // Create form data for sending
    const formData = new FormData();
    
    // Email must be sent as array for Spring Boot
    const toEmails = shareEmail.split(',').map(email => email.trim()).filter(email => email);
    toEmails.forEach(email => {
      formData.append('to', email);
    });
    
    // Append CC if provided
    if (shareCC.trim()) {
      const ccEmails = shareCC.split(',').map(email => email.trim()).filter(email => email);
      ccEmails.forEach(email => {
        formData.append('cc', email);
      });
    }
    
    formData.append('subject', shareSubject);
    formData.append('body', shareMessage);
    
    // Add PDF file
    const pdfFile = new File(
      [pdfBlob], 
      `GRR_Study_${study.studyName || study.gageNumber}_${study.partNumber}.pdf`,
      { type: 'application/pdf' }
    );
    
    // Append the file
    formData.append('attachments', pdfFile);
    
    console.log("Sending email with PDF attachment...");
    
    try {
      const response = await fetch('http://localhost:8080/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const result = await response.text();
        console.log("Success:", result);
        setMailStatus("✓ Email sent successfully with PDF attachment!");
        
        // Clear form after success
        setTimeout(() => {
          setShowShareOptions(false);
          setShareEmail("");
          setShareCC("");
          setMailStatus("");
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        
        // Try without attachment if file size is an issue
        if (pdfBlob.size > 10 * 1024 * 1024) {
          setMailStatus("File too large. Sending without attachment...");
          await sendEmailWithoutAttachment();
        } else {
          setMailStatus(`Server error: ${errorText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setMailStatus(`Network error: ${error.message}`);
    } finally {
      setIsSendingMail(false);
    }
  };

  // Fallback: Send email without attachment
  const sendEmailWithoutAttachment = async () => {
    try {
      const formData = new FormData();
      const toEmails = shareEmail.split(',').map(email => email.trim()).filter(email => email);
      toEmails.forEach(email => {
        formData.append('to', email);
      });
      
      if (shareCC.trim()) {
        const ccEmails = shareCC.split(',').map(email => email.trim()).filter(email => email);
        ccEmails.forEach(email => {
          formData.append('cc', email);
        });
      }
      
      formData.append('subject', `${shareSubject} (Report Available in Application)`);
      formData.append('body', `${shareMessage}\n\nNote: The full GRR Study Report PDF is available for download in the application.`);
      
      const response = await fetch('http://localhost:8080/api/mail/send', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setMailStatus("✓ Email sent! (Report available in application)");
        setTimeout(() => {
          setShowShareOptions(false);
          setMailStatus("");
        }, 3000);
      } else {
        const errorText = await response.text();
        setMailStatus(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error sending email without attachment:", error);
      setMailStatus("Failed to send email");
    }
  };

  // Calculate overall stats for display
  const overallStats = formData.measurementData && Object.keys(formData.measurementData).length > 0 
    ? calculateOverallStats(
        formData.measurementData,
        formData.numberOfAppraisers,
        formData.numberOfParts,
        formData.numberOfTrials
      )
    : null;

  return (
    <>
      {/* PDF Generation Loading Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generating PDF</h3>
              <p className="text-sm text-gray-600">Please wait while we prepare your document...</p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Quality Selection Modal */}
      {showQualityOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select PDF Quality</h3>
              <button
                onClick={() => setShowQualityOptions(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => handleGeneratePDF("low")}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex flex-col items-start transition-colors"
                >
                  <span className="font-semibold">Low Quality</span>
                  <span className="text-sm text-gray-600">Smaller file size, lower resolution</span>
                </button>
                
                <button
                  onClick={() => handleGeneratePDF("medium")}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg flex flex-col items-start transition-colors"
                >
                  <span className="font-semibold">Medium Quality</span>
                  <span className="text-sm text-gray-600">Recommended balance of quality and size</span>
                </button>
                
                <button
                  onClick={() => handleGeneratePDF("high")}
                  className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg flex flex-col items-start transition-colors"
                >
                  <span className="font-semibold">High Quality</span>
                  <span className="text-sm text-gray-600">Best quality, larger file size</span>
                </button>
              </div>
              
              <p className="mt-4 text-sm text-gray-500 text-center">
                The same PDF structure will be generated for all quality options
              </p>
            </div>
          </div>
        </div>
      )}

{/* Share Report Modal */}
{showShareOptions && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Share Report</h3>
        <button
          onClick={() => {
            setShowShareOptions(false);
            setMailStatus("");
          }}
          className="p-2 rounded-lg hover:bg-red-200 transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

{/* ================= EMAIL ================= */}
<div className="border rounded-xl p-5 shadow-sm">
  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
<img 
  src="https://cdn-icons-png.flaticon.com/512/1271/1271841.png" 
  alt="Email Logo" 
  width="30" height="30" 
/>

    Send via Email
  </h4>

  {/* TO */}
  <div className="mb-3">
    <input
      type="email"
      value={shareEmail}
      onChange={(e) => setShareEmail(e.target.value)}
      placeholder="To *"
      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
    />
    {shareEmail && !shareEmail.includes("@") && (
      <p className="text-xs text-red-600 mt-1">
        Email must contain "@"
      </p>
    )}
  </div>

  {/* CC LIST */}
  {ccList.map((cc, index) => (
    <div key={index} className="mb-2 flex gap-2">
      <input
        type="email"
        value={cc}
        onChange={(e) => {
          const updated = [...ccList];
          updated[index] = e.target.value;
          setCcList(updated);
          setShareCC(updated.filter(Boolean).join(","));
        }}
        placeholder={`CC Email ${index + 1}`}
        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <button
        type="button"
        onClick={() => {
          const updated = ccList.filter((_, i) => i !== index);
          setCcList(updated);
          setShareCC(updated.filter(Boolean).join(","));
        }}
        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
      >
        ✕
      </button>
    </div>
  ))}

  {/* ADD CC BUTTON */}
  <button
    type="button"
    onClick={() => setCcList([...ccList, ""])}
    className="mb-4 text-sm text-blue-600 hover:underline"
  >
    + Add CC
  </button>

  {/* SUBJECT */}
  <input
    type="text"
    value={shareSubject}
    onChange={(e) => setShareSubject(e.target.value)}
    placeholder="Subject"
    className="w-full mb-3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
  />

  {/* MESSAGE */}
  <textarea
    rows="3"
    value={shareMessage}
    onChange={(e) => setShareMessage(e.target.value)}
    placeholder="Message"
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
  />

  {mailStatus && (
    <div className={`mt-3 text-sm font-medium ${
      mailStatus.includes("✓")
        ? "text-green-600"
        : mailStatus.includes("Error")
        ? "text-red-600"
        : "text-blue-600"
    }`}>
      {mailStatus}
    </div>
  )}

  <button
    onClick={handleSendEmail}
    disabled={
      isSendingMail ||
      !shareEmail.trim() ||
      !shareEmail.includes("@")
    }
    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
  >
    {isSendingMail ? (
      <>
        <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
        Sending...
      </>
    ) : (
      <>
        <Mail className="w-4 h-4" />
        Send Email
      </>
    )}
  </button>

  <p className="mt-2 text-xs text-gray-500 text-center">
    PDF will be attached
  </p>
</div>


{/* ================= QUICK SHARE (COMING SOON) ================= */}
{/* <div className="border rounded-xl p-5 shadow-sm">
  <h4 className="text-base font-semibold text-gray-800 mb-4">

    Quick Share
  </h4>

  <p className="text-sm text-gray-600 mb-6">
    Sharing options will be available soon.
  </p>

  <div className="space-y-4">

    <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-gray-50 opacity-70 cursor-not-allowed">
      <div className="flex items-center gap-3">
      <img 
  src="https://png.pngtree.com/element_our/sm/20180626/sm_5b321c99945a2.jpg" 
  alt="WhatsApp Logo" 
  width="50" height="50" 
/>


        <div>
          <p className="text-sm font-medium text-gray-800">WhatsApp</p>
          <p className="text-xs text-gray-500">Instant messaging</p>
        </div>
      </div>

      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
        Coming Soon
      </span>
    </div>

    <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-gray-50 opacity-70 cursor-not-allowed">
      <div className="flex items-center gap-3">
<img 
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Microsoft_Office_Teams_%282019%E2%80%932025%29.svg/330px-Microsoft_Office_Teams_%282019%E2%80%932025%29.svg.png" 
  alt="Microsoft Teams Logo" 
  width="30" height="30" 
/>


        <div>
          <p className="text-sm font-medium text-gray-800">Microsoft Teams</p>
          <p className="text-xs text-gray-500">Team collaboration</p>
        </div>
      </div>

      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
        Coming Soon
      </span>
    </div>

    <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-gray-50 opacity-70 cursor-not-allowed">
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#4B5563">
          <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
        </svg>

        <div>
          <p className="text-sm font-medium text-gray-800">Message</p>
          <p className="text-xs text-gray-500">SMS / Text</p>
        </div>
      </div>

      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
        Coming Soon
      </span>
    </div>
  </div>
</div> */}
        </div>
      </div>  
    </div>
  </div>
)}


      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
        <div 
          ref={previewRef}
          className="bg-white rounded-xl shadow-xl w-full max-w-[95%] max-h-[95vh] overflow-y-auto my-4"
          id="grr-preview-content"
        >
          {/* Header (UI Only) */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-400 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">GR&R Study Preview</h2>
              <p className="text-sm text-gray-600">
                {study.studyName || study.gageNumber} - {study.partNumber}
              </p>
            </div>
            <div className="flex gap-3 header-buttons">
              {/* Share Report Button - Added here */}
              <button
                onClick={handleShareClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              <button
                onClick={handleDownloadClick}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Content - Divided into 3 parts */}
        <div className="p-6">
          
          {/* Report Header */}
          <div id="pdf-report-header" className="w-full border border-black bg-gray-200 mb-6 text-sm">
            <div className="grid grid-cols-12">
              {/* Left: Company Logo + Name */}
              <div className="col-span-3 border-r border-black p-2 flex items-center justify-center font-bold">
                <div className="flex items-center gap-6 text-base  leading-tight text-start">
        
                  {/* Company Name */}
                  <div>
                    <div>HIGH TENSILE</div>
                    <div>FASTNUTS (I) PVT LTD</div>
                  </div>
                  {/* Logo */}
                  <img
                    src={HTRimage}
                    alt="HTR"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Center: Report Title with Image */}
              <div className="col-span-6 border-r border-black flex items-center justify-center gap-3 font-bold text-xl">
                <span>Variable GR&amp;R Study Report</span>
              </div>

              {/* Right: Document Info */}
              <div className="col-span-3 text-xs">
                <div className="border-b border-black p-1">
                  <span className="font-semibold">DOC NO.:</span>{" "}
                  {formData.documentNumber || "QC/23"}
                </div>
                <div className="border-b border-black p-1">
                  <span className="font-semibold">REV NO./DT.:</span>{" "}
                  {formData.revisionNumberDate || `02/${getTodayDate()}`}
                </div>
                <div className="p-1">
                  <span className="font-semibold">PAGE:</span>{" "}
                  {formData.pageInfo || "01 OF 01"}
                </div>
              </div>
            </div>
          </div>

          {/* PART 1: Study Parameters and Input Data */}
          <div id="pdf-part-1" className="mb-8   rounded-lg">
            
            {/* Study Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-300 p-4 rounded-lg bg-gray-50 mb-6">
              <div>
                <span className="text-xs font-semibold text-gray-700">Part Name:</span>
                <div className="text-sm">{formData.partName || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Part Number:</span>
                <div className="text-sm">{formData.partNumber || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Characteristic:</span>
                <div className="text-sm">{formData.characteristic || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Specification:</span>
                <div className="text-sm">
                  {formData.lowerSpecification} - {formData.upperSpecification} {formData.units}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Gage Name:</span>
                <div className="text-sm">{formData.studyName || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Gage Number:</span>
                <div className="text-sm">{formData.gageNumber || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Date Performed:</span>
                <div className="text-sm">
                  {formData.studyDate ? new Date(formData.studyDate).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Conducted By:</span>
                <div className="text-sm">{formData.conductedBy || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">No. of Trials:</span>
                <div className="text-sm">{formData.numberOfTrials || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">No. of Parts:</span>
                <div className="text-sm">{formData.numberOfParts || "—"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">No. of Appraiser:</span>
                <div className="text-sm">{formData.numberOfAppraisers || "—"}</div>
              </div>
            </div>

            {/* Measurement Data Table */}
            {formData.measurementData && Object.keys(formData.measurementData).length > 0 && overallStats && (
              <div className="border border-gray-300 rounded-lg p-4 mb-4">
                <h4 className="text-md font-bold text-gray-800 mb-4">Measurement Data with Averages</h4>
                <div className="space-y-6">
                  {Array.from({ length: formData.numberOfAppraisers }, (_, appraiserIndex) => {
                    const appraiserNum = appraiserIndex + 1;
                    const appraiserKey = appraiserNum.toString();
                    const appraiserMeasurements = formData.measurementData[appraiserKey] || {};
                    const stats = calculateAppraiserStats(
                      formData.measurementData,
                      appraiserNum,
                      formData.numberOfParts,
                      formData.numberOfTrials
                    );
                    const isOutOfControl = overallStats.outOfControlAppraisers.includes(appraiserNum);
                    
                    return (
                      <div key={`appraiser-${appraiserNum}`} className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className={`px-4 py-2 border-b border-gray-300 ${isOutOfControl ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <h5 className={`font-semibold ${isOutOfControl ? 'text-red-800' : 'text-gray-800'}`}>
                            Appraiser #{appraiserNum}
                          </h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-300">
                                <th className="border border-gray-300 px-3 py-2 text-center text-base font-semibold text-gray-700">Trial #</th>
                                {Array.from({ length: formData.numberOfParts }, (_, partIndex) => (
                                  <th key={`part-${partIndex}`} className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">
                                    Part {partIndex + 1}
                                  </th>
                                ))}
                                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">Average</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">Range</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: formData.numberOfTrials }, (_, trialIndex) => {
                                const trialNum = trialIndex + 1;
                                const trialKey = trialNum.toString();
                                const trialValues = [];
                                
                                return (
                                  <tr key={`trial-${trialIndex}`} className="border-b border-gray-200">
                                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-medium text-gray-900">
                                      Trial {trialNum}
                                    </td>
                                    {Array.from({ length: formData.numberOfParts }, (_, partIndex) => {
                                      const partNum = partIndex + 1;
                                      const partKey = partNum.toString();
                                      const partMeasurements = appraiserMeasurements[partKey] || {};
                                      const value = partMeasurements[trialKey] || "";
                                      
                                      if (value !== "" && !isNaN(value)) {
                                        trialValues.push(parseFloat(value));
                                      }
                                      
                                      return (
                                        <td key={`part-${partIndex}`} className="border border-gray-300 px-2 py-1 text-sm text-center">
                                          {value !== "" ? parseFloat(value).toFixed(3) : "—"}
                                        </td>
                                      );
                                    })}
                                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                                      {trialValues.length > 0 ? 
                                        (trialValues.reduce((a, b) => a + b, 0) / trialValues.length).toFixed(3) : 
                                        "—"
                                      }
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                                      {trialValues.length > 1 ? 
                                        (Math.max(...trialValues) - Math.min(...trialValues)).toFixed(3) : 
                                        "—"
                                      }
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-50 border-t-2 border-gray-400">
                                <td className="border text-center border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900">Average</td>
                                {Array.from({ length: formData.numberOfParts }, (_, partIndex) => (
                                  <td key={`part-avg-${partIndex}`} className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                                    {stats.partAverages[partIndex] !== null ? stats.partAverages[partIndex].toFixed(3) : "—"}
                                  </td>
                                ))}
                                <td className={`border border-gray-300 px-3 py-2 text-sm text-center font-semibold ${isOutOfControl ? 'text-red-600' : 'text-gray-700'}`}>
                                  {stats.overallAverage.toFixed(2)}
                                </td>
                                <td className={`border border-gray-300 px-3 py-2 text-sm text-gray-700 font-semibold ${isOutOfControl ? 'text-red-600' : ''}`}>
                                  X{String.fromCharCode(96 + appraiserNum)}={stats.overallAverage.toFixed(2)}
                                </td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900">Range</td>
                                {Array.from({ length: formData.numberOfParts }, (_, partIndex) => (
                                  <td key={`part-range-${partIndex}`} className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                                    {stats.partRanges[partIndex] !== null ? stats.partRanges[partIndex].toFixed(3) : "—"}
                                  </td>
                                ))}
                                <td className={`border border-gray-300 px-3 py-2 text-sm text-center font-semibold ${isOutOfControl ? 'text-red-600' : 'text-gray-700'}`}>
                                  {stats.overallRange.toFixed(2)}
                                </td>
                                <td className={`border border-gray-300 px-3 py-2 text-sm text-gray-700 font-semibold ${isOutOfControl ? 'text-red-600' : ''}`}>
                                  r{String.fromCharCode(96 + appraiserNum)}={stats.overallRange.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Average of Appraiser Average Section */}
                  <div className="bg-yellow-50 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-orange-100 border-b-2 border-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-center text-base font-semibold text-gray-700">Average of Appraiser Average</th>
                            {Array.from({ length: formData.numberOfParts }, (_, partIndex) => (
                              <th key={`part-${partIndex}`} className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">
                                Part {partIndex + 1}
                              </th>
                            ))}
                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">X</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Rp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Range Row - showing range of appraiser averages for each part */}
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900 bg-blue-50">Range</td>
                            {Array.from({ length: formData.numberOfParts }, (_, partIndex) => {
                              // Calculate range of appraiser averages for this part
                              const appraiserAverages = [];
                              for (let appraiserNum = 1; appraiserNum <= formData.numberOfAppraisers; appraiserNum++) {
                                const appraiserKey = appraiserNum.toString();
                                const appraiserData = formData.measurementData[appraiserKey] || {};
                                const partKey = (partIndex + 1).toString();
                                const partData = appraiserData[partKey] || {};
                                const values = [];
                                
                                for (let trialIndex = 1; trialIndex <= formData.numberOfTrials; trialIndex++) {
                                  const trialKey = trialIndex.toString();
                                  const value = partData[trialKey];
                                  if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
                                    values.push(parseFloat(value));
                                  }
                                }
                                
                                if (values.length > 0) {
                                  const avg = values.reduce((a, b) => a + b, 0) / values.length;
                                  appraiserAverages.push(avg);
                                }
                              }
                              
                              // Range of averages = max(avg) - min(avg) for this part
                              const rangeOfAverages = appraiserAverages.length > 1 
                                ? Math.max(...appraiserAverages) - Math.min(...appraiserAverages)
                                : 0;
                              
                              return (
                                <td key={`range-${partIndex}`} className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-medium bg-blue-50">
                                  {rangeOfAverages.toFixed(3)}
                                </td>
                              );
                            })}
                            <td className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-semibold bg-blue-50">
                              {overallStats.R.toFixed(2)}
                            </td>
                            <td className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-semibold bg-blue-50">
                              r{String.fromCharCode(96 + formData.numberOfAppraisers)}={overallStats.appraiserOverallRanges[formData.numberOfAppraisers - 1]?.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                          
                          {/* Average Row */}
                          <tr>
                            <td className="border border-yellow-400 px-3 py-2 text-sm font-semibold text-center text-gray-900">Average</td>
                            {Array.from({ length: formData.numberOfParts }, (_, partIndex) => (
                              <td key={`avg-${partIndex}`} className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                                {overallStats.averageOfAppraiserAverages[partIndex] !== null 
                                  ? overallStats.averageOfAppraiserAverages[partIndex].toFixed(3) 
                                  : "—"}
                              </td>
                            ))}
                            <td className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-semibold">
                              {overallStats.X.toFixed(2)}
                            </td>
                            <td className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-semibold">
                              {overallStats.Rp.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Out of Control Status, Note, and Statistics */}
                    <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Side: OUT OF CONTROL Box and Note */}
                        <div className="flex-1 flex items-start gap-4">
                          {/* OUT OF CONTROL Box */}
                          {overallStats.outOfControlAppraisers.length > 0 && (
                            <>
                              <div className="border-2 border-green-600 px-0 py-0 bg-white flex items-center relative">
                                {/* Inner black border section for APPRAISER */}
                                <div className="border-r border-black px-3 py-2 flex items-center">
                                  <span className="text-red-600 font-bold text-sm">APPRAISER</span>
                                </div>
                                <div className="px-3 py-2 flex items-center gap-2 flex-1">
                                  <span className="text-red-600 font-bold text-base">
                                    {overallStats.outOfControlAppraisers.map(num => String.fromCharCode(64 + num)).join(", ")} OUT OF CONTROL
                                  </span>
                                  <span className="text-red-600 text-lg ml-auto">▶</span>
                                </div>
                              </div>
                              
                              {/* Note */}
                              <div className="text-red-600 text-xs italic flex-1 max-w-md">
                                Note: If any appraiser is "Out of Control" Repeat these readings using the same appraiser and unit as originally used or discard values and re-average and recompute R and the limiting value from the remaining observations.
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Right Side: Statistics in vertical stack - Always visible */}
                        <div className="flex flex-col border border-black bg-white min-w-[120px]">
                          {/* R= row */}
                          <div className="flex items-center border-b border-black px-3 py-2">
                            <span className="text-blue-700 font-semibold mr-2">▶</span>
                            <span className="text-blue-700 font-semibold mr-2">R=</span>
                            <span className="text-black font-bold">{overallStats.R.toFixed(2)}</span>
                          </div>
                          
                          {/* XDIFF= row */}
                          <div className="flex items-center border-b border-black px-3 py-2">
                            <span className="text-blue-700 font-semibold mr-2">▶</span>
                            <span className="text-blue-700 font-semibold mr-2">XDIFF=</span>
                            <span className="text-black font-bold">{overallStats.XDIFF.toFixed(2)}</span>
                          </div>
                          
                          {/* UCLR= row */}
                          <div className="flex items-center px-3 py-2">
                            <span className="text-blue-700 font-semibold mr-2">▶</span>
                            <span className="text-blue-700 font-semibold mr-2">UCLR=</span>
                            <span className="text-black font-bold">{overallStats.UCLR.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PART 2: Formulas and Calculations */}
          {calculationResults.percentGRR !== null && (
            <div id="pdf-part-2" className="mb-8 border-2 rounded-lg">
              <GRRResults 
                results={calculationResults} 
                formData={formData}
              />
            </div>
          )}

          {/* PART 3: Charts */}
          {calculationResults.percentGRR !== null && (
            <div id="pdf-part-3" className="mb-8  rounded-lg p-4">
              <GRRCharts 
                results={calculationResults}
                formData={formData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default GRRPreview;