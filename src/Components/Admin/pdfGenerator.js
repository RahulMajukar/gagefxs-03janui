import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { calculateAppraiserStats, calculateOverallStats } from "../utils/grrCalculations";
import HTFimage from "../assets/HTF.png";

export const generateGRRPDF = async (study) => {
  try {
    // Create a temporary container for PDF generation
    const container = document.createElement("div");
    container.id = "pdf-container";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "210mm"; // A4 width
    container.style.padding = "0";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(container);
    
    // Build PDF content with all pages
    const pdfContent = buildPDFContent(study);
    container.innerHTML = pdfContent;
    
    // Wait for content to load and images to render
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Configure html2canvas options
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: container.offsetWidth,
      windowWidth: container.offsetWidth,
      windowHeight: container.offsetHeight,
      onclone: (document) => {
        // Force SVG elements to render properly
        const svgs = document.querySelectorAll('svg');
        svgs.forEach(svg => {
          svg.setAttribute('width', svg.getAttribute('width') || '100%');
          svg.setAttribute('height', svg.getAttribute('height') || '100%');
          svg.setAttribute('style', 'max-width: 100%; height: auto;');
        });
        
        // Force images to load properly
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.setAttribute('crossOrigin', 'anonymous');
        });
      }
    });
    
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF with proper page handling
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Calculate number of pages needed
    const totalPages = Math.ceil(imgHeight / pageHeight);
    
    // Add pages with proper content slicing
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      
      // Position content on each page with header/footer
      const position = -i * pageHeight;
      
      // Add content
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      
      // Add footer with page numbers and timestamp (on all pages)
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getFullYear()).slice(-2)}`;
      const timeStr = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}:${String(today.getSeconds()).padStart(2, "0")}`;
      
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Page ${i + 1} of ${totalPages} | Generated: ${dateStr} ${timeStr}`, 15, 287); // Bottom left
      pdf.text(`${study.documentNumber || "QC/23"} | REV: ${study.revisionNumberDate || "02/01.11.15"}`, 195, 287, { align: 'right' }); // Bottom right
    }
    
    // Cleanup
    document.body.removeChild(container);
    
    // Save PDF
    const fileName = `GRR_Study_${study.id || study.gageNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

const buildPDFContent = (study) => {
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
  
  const results = {
    equipmentVariation: study.equipmentVariation,
    appraiserVariation: study.appraiserVariation,
    grrValue: study.grrValue,
    partVariation: study.partVariation,
    totalVariation: study.totalVariation,
    percentEV: study.percentEV,
    percentAV: study.percentAV,
    percentGRR: study.percentGRR,
    percentPV: study.percentPV,
    numberOfDistinctCategories: study.numberOfDistinctCategories,
    k1: study.k1,
    k2: study.k2,
    k3: study.k3,
    averageRange: study.averageRange,
    xDiff: study.xDiff,
    rangeOfPartAverages: study.rangeOfPartAverages,
    status: study.status
  };
  
  const formatNum = (num, decimals = 5) => {
    if (num === null || num === undefined || isNaN(num)) return "0.00000";
    return parseFloat(Number(num).toFixed(decimals));
  };
  
  const formatPercent = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0.00";
    return parseFloat(Number(num).toFixed(2));
  };
  
  const SQUARED = "²";
  
  let html = `
  <div style="font-family: Arial, sans-serif; color: #333; width: 210mm; margin: 0 auto; page-break-after: always;">
    <!-- Page 1: Header, Study Parameters, Measurement Data (Part 1) -->
    <div style="padding: 15mm 15mm 10mm 15mm;">
      <!-- Header - Matching the UI exactly -->
      <div style="border: 1px solid #000; background-color: #e6e6e6; margin-bottom: 10mm;">
        <div style="display: grid; grid-template-columns: 3fr 6fr 3fr; height: 40mm;">
          <!-- Left: Company Logo + Name -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <!-- Logo placeholder - will be replaced with actual image in PDF generation -->
              <div style="height: 20mm; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${HTFimage}" 
                  alt="Company Logo" 
                  style="height: 18mm; width: auto; object-fit: contain;"
                />
              </div>
              <div style="font-weight: bold; font-size: 3mm; line-height: 1.2;">
                HIGH TENSILE<br/>
                FASTNUTS (I) PVT<br/>
                LTD
              </div>
            </div>
          </div>
          
          <!-- Center: Report Title -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 4mm;">
            Variable GR&amp;R Study Report
          </div>
          
          <!-- Right: Document Info -->
          <div style="font-size: 2.5mm; padding: 1mm;">
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">DOC NO.:</span> ${formData.documentNumber || "QC/23"}
            </div>
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">REV NO./DT.:</span> ${formData.revisionNumberDate || "02/01.11.15"}
            </div>
            <div style="padding: 1mm 0;">
              <span style="font-weight: bold;">PAGE:</span> 01 OF 05
            </div>
          </div>
        </div>
      </div>
      
      <!-- Study Parameters -->
      <div style="border: 1px solid #ccc; padding: 8mm; margin-bottom: 10mm; background-color: #f9f9f9; font-size: 2.8mm;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm;">
          <div><strong>Part Name:</strong> ${formData.partName || "—"}</div>
          <div><strong>Part Number:</strong> ${formData.partNumber || "—"}</div>
          <div><strong>Characteristic:</strong> ${formData.characteristic || "—"}</div>
          <div><strong>Specification:</strong> ${formData.lowerSpecification} - ${formData.upperSpecification} ${formData.units}</div>
          <div><strong>Gage Name:</strong> ${formData.studyName || "—"}</div>
          <div><strong>Gage Number:</strong> ${formData.gageNumber || "—"}</div>
          <div><strong>Date Performed:</strong> ${formData.studyDate ? new Date(formData.studyDate).toLocaleDateString() : "—"}</div>
          <div><strong>Conducted By:</strong> ${formData.conductedBy || "—"}</div>
          <div><strong>No. of Trials:</strong> ${formData.numberOfTrials || "—"}</div>
          <div><strong>No. of Parts:</strong> ${formData.numberOfParts || "—"}</div>
          <div><strong>No. of Appraiser:</strong> ${formData.numberOfAppraisers || "—"}</div>
        </div>
      </div>
      
      <!-- Measurement Data Table - Top Half -->
      <h3 style="font-size: 3.8mm; font-weight: bold; margin-bottom: 5mm;">Measurement Data</h3>
      ${generateMeasurementTableHTML(study.measurementData || {}, formData, 'top')}
    </div>
    
    <!-- Page Break -->
    <div style="page-break-before: always;"></div>
    
    <!-- Page 2: Measurement Data (Part 2) -->
    <div style="padding: 15mm 15mm 10mm 15mm;">
      <!-- Header - Same as page 1 but with updated page number -->
      <div style="border: 1px solid #000; background-color: #e6e6e6; margin-bottom: 10mm;">
        <div style="display: grid; grid-template-columns: 3fr 6fr 3fr; height: 40mm;">
          <!-- Left: Company Logo + Name -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="height: 20mm; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${HTFimage}" 
                  alt="Company Logo" 
                  style="height: 18mm; width: auto; object-fit: contain;"
                />
              </div>
              <div style="font-weight: bold; font-size: 3mm; line-height: 1.2;">
                HIGH TENSILE<br/>
                FASTNUTS (I) PVT<br/>
                LTD
              </div>
            </div>
          </div>
          
          <!-- Center: Report Title -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 4mm;">
            Variable GR&amp;R Study Report
          </div>
          
          <!-- Right: Document Info with updated page number -->
          <div style="font-size: 2.5mm; padding: 1mm;">
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">DOC NO.:</span> ${formData.documentNumber || "QC/23"}
            </div>
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">REV NO./DT.:</span> ${formData.revisionNumberDate || "02/01.11.15"}
            </div>
            <div style="padding: 1mm 0;">
              <span style="font-weight: bold;">PAGE:</span> 02 OF 05
            </div>
          </div>
        </div>
      </div>
      
      <!-- Measurement Data Table - Bottom Half -->
      ${generateMeasurementTableHTML(study.measurementData || {}, formData, 'bottom')}
    </div>
    
    <!-- Page Break -->
    <div style="page-break-before: always;"></div>
    
    <!-- Page 3: Results -->
    <div style="padding: 15mm 15mm 10mm 15mm;">
      <!-- Header - Same as page 1 but with updated page number -->
      <div style="border: 1px solid #000; background-color: #e6e6e6; margin-bottom: 10mm;">
        <div style="display: grid; grid-template-columns: 3fr 6fr 3fr; height: 40mm;">
          <!-- Left: Company Logo + Name -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="height: 20mm; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${HTFimage}" 
                  alt="Company Logo" 
                  style="height: 18mm; width: auto; object-fit: contain;"
                />
              </div>
              <div style="font-weight: bold; font-size: 3mm; line-height: 1.2;">
                HIGH TENSILE<br/>
                FASTNUTS (I) PVT<br/>
                LTD
              </div>
            </div>
          </div>
          
          <!-- Center: Report Title -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 4mm;">
            Variable GR&amp;R Study Report
          </div>
          
          <!-- Right: Document Info with updated page number -->
          <div style="font-size: 2.5mm; padding: 1mm;">
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">DOC NO.:</span> ${formData.documentNumber || "QC/23"}
            </div>
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">REV NO./DT.:</span> ${formData.revisionNumberDate || "02/01.11.15"}
            </div>
            <div style="padding: 1mm 0;">
              <span style="font-weight: bold;">PAGE:</span> 03 OF 05
            </div>
          </div>
        </div>
      </div>
      
      <!-- Analysis Results -->
      <div style="border: 2px solid #666; margin-bottom: 0; page-break-inside: avoid;">
        <div style="background-color: #ffcc99; padding: 8mm; border-bottom: 2px solid #666;">
          <h2 style="font-size: 4.5mm; font-weight: bold; margin: 0; text-align: center;">Measurement Unit Analysis</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); font-size: 2.8mm;">
          <!-- Left Column -->
          <div style="border-right: 2px solid #666; padding: 8mm;">
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">Repeatability - Equipment Variation (EV)</div>
              <div style="font-size: 2.2mm; color: #666;">EV = R x K1 = ${formatNum(study.averageRange || 0)} x ${formatNum(study.k1 || 0, 4)}</div>
              <div style="font-size: 3mm; font-weight: bold;">EV = ${formatNum(results.equipmentVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">Reproducibility - Appraiser Variation (AV)</div>
              <div style="font-size: 2.2mm; color: #666;">AV = {(XDIFF x K2)${SQUARED} - (EV${SQUARED}/nr)}^(1/2)</div>
              <div style="font-size: 3mm; font-weight: bold;">AV = ${formatNum(results.appraiserVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">Repeatability & Reproducibility (GRR)</div>
              <div style="font-size: 2.2mm; color: #666;">GRR = {(EV${SQUARED} + AV${SQUARED})}^(1/2)</div>
              <div style="font-size: 3mm; font-weight: bold;">GRR = ${formatNum(results.grrValue)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">Part Variation (PV)</div>
              <div style="font-size: 2.2mm; color: #666;">PV = Rp x K3 = ${formatNum(study.rangeOfPartAverages || 0)} x ${formatNum(study.k3 || 0, 4)}</div>
              <div style="font-size: 3mm; font-weight: bold;">PV = ${formatNum(results.partVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">Total Variation (TV)</div>
              <div style="font-size: 2.2mm; color: #666;">TV = {(GRR${SQUARED} + PV${SQUARED})}^(1/2)</div>
              <div style="font-size: 3mm; font-weight: bold;">TV = ${formatNum(results.totalVariation)}</div>
            </div>
          </div>
          
          <!-- Middle Column -->
          <div style="border-right: 2px solid #666; padding: 8mm;">
            <div style="background-color: #ffcc99; padding: 8mm; border-bottom: 2px solid #666; margin-bottom: 4mm;">
              <h3 style="font-size: 3.5mm; font-weight: bold; margin: 0; text-align: center;">% Total Variation (TV)</h3>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">% EV</div>
              <div style="font-size: 2.2mm; color: #666;">% EV = 100 (EV/TV)</div>
              <div style="font-size: 3mm; font-weight: bold;">% EV = ${formatPercent(results.percentEV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">% AV</div>
              <div style="font-size: 2.2mm; color: #666;">% AV = 100 (AV/TV)</div>
              <div style="font-size: 3mm; font-weight: bold;">% AV = ${formatPercent(results.percentAV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">% GRR</div>
              <div style="font-size: 2.2mm; color: #666;">% GRR = 100 (GRR/TV)</div>
              <div style="font-size: 3mm; font-weight: bold;">% GRR = ${formatPercent(results.percentGRR)}</div>
              <div style="font-size: 2.5mm; padding: 2mm; margin-top: 2mm; background-color: ${results.percentGRR <= 10 ? "#90EE90" : results.percentGRR <= 30 ? "#FFE4B5" : "#FFB6C1"}; text-align: center;">
                ${results.percentGRR <= 10 ? "Gage system O.K" : results.percentGRR <= 30 ? "Gage system Marginal" : "Gage system Unacceptable"}
              </div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm; margin-bottom: 4mm; border-bottom: 1px solid #ccc;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">% PV</div>
              <div style="font-size: 2.2mm; color: #666;">% PV = 100 (PV/TV)</div>
              <div style="font-size: 3mm; font-weight: bold;">% PV = ${formatPercent(results.percentPV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 6mm;">
              <div style="font-size: 2.5mm; font-weight: bold; margin-bottom: 2mm;">ndc (Number of Distinct Categories)</div>
              <div style="font-size: 2.2mm; color: #666;">ndc = 1.41(PV/GRR)</div>
              <div style="font-size: 3mm; font-weight: bold;">ndc = ${results.numberOfDistinctCategories || 0}</div>
              <div style="font-size: 2.5mm; padding: 2mm; margin-top: 2mm; background-color: ${results.numberOfDistinctCategories >= 5 ? "#90EE90" : "#FFE4B5"}; text-align: center;">
                ${results.numberOfDistinctCategories >= 5 ? "Gage discrimination is acceptable" : "Gage discrimination may be marginal"}
              </div>
            </div>
          </div>
          
          <!-- Right Column - K Tables -->
          <div style="padding: 8mm;">
            <div style="background-color: #ffcc99; padding: 8mm; border-bottom: 2px solid #666; margin-bottom: 8mm;">
              <h3 style="font-size: 3.5mm; font-weight: bold; margin: 0; text-align: center;">Standard Tables</h3>
            </div>
            <div style="margin-bottom: 10mm; font-size: 2.5mm;">
              <div style="font-weight: bold; margin-bottom: 4mm;">K1 Table (for Trials)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 2.2mm;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 2mm;">Trials</th>
                    <th style="border: 1px solid #ccc; padding: 2mm;">K1</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">2</td><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">0.8865</td></tr>
                  <tr><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">3</td><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">0.5907</td></tr>
                </tbody>
              </table>
            </div>
            <div style="margin-bottom: 10mm; font-size: 2.5mm;">
              <div style="font-weight: bold; margin-bottom: 4mm;">K2 Table (for Appraiser)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 2.2mm;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 2mm;">Appraiser</th>
                    <th style="border: 1px solid #ccc; padding: 2mm;">K2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">2</td><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">0.7087</td></tr>
                  <tr><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">3</td><td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">0.5236</td></tr>
                </tbody>
              </table>
            </div>
            <div style="font-size: 2.5mm;">
              <div style="font-weight: bold; margin-bottom: 4mm;">K3 Table (for Parts)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 2.2mm;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 2mm;">Parts</th>
                    <th style="border: 1px solid #ccc; padding: 2mm;">K3</th>
                  </tr>
                </thead>
                <tbody>
                  ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(parts => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">${parts}</td>
                    <td style="border: 1px solid #ccc; padding: 2mm; text-align: center; font-size: 2.0mm;">
                      ${parts === 2 ? "0.7087" : parts === 3 ? "0.5236" : parts === 4 ? "0.4464" : parts === 5 ? "0.4032" : parts === 6 ? "0.3745" : parts === 7 ? "0.3534" : parts === 8 ? "0.3378" : parts === 9 ? "0.3247" : "0.3145"}
                    </td>
                  </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Page Break -->
    <div style="page-break-before: always;"></div>
    
    <!-- Page 4: First Two Charts -->
    <div style="padding: 15mm 15mm 10mm 15mm;">
      <!-- Header - Same as page 1 but with updated page number -->
      <div style="border: 1px solid #000; background-color: #e6e6e6; margin-bottom: 10mm;">
        <div style="display: grid; grid-template-columns: 3fr 6fr 3fr; height: 40mm;">
          <!-- Left: Company Logo + Name -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="height: 20mm; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${HTFimage}" 
                  alt="Company Logo" 
                  style="height: 18mm; width: auto; object-fit: contain;"
                />
              </div>
              <div style="font-weight: bold; font-size: 3mm; line-height: 1.2;">
                HIGH TENSILE<br/>
                FASTNUTS (I) PVT<br/>
                LTD
              </div>
            </div>
          </div>
          
          <!-- Center: Report Title -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 4mm;">
            Variable GR&amp;R Study Report
          </div>
          
          <!-- Right: Document Info with updated page number -->
          <div style="font-size: 2.5mm; padding: 1mm;">
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">DOC NO.:</span> ${formData.documentNumber || "QC/23"}
            </div>
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">REV NO./DT.:</span> ${formData.revisionNumberDate || "02/01.11.15"}
            </div>
            <div style="padding: 1mm 0;">
              <span style="font-weight: bold;">PAGE:</span> 04 OF 05
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div style="margin-top: 5mm;">
        <h2 style="font-size: 4.5mm; font-weight: bold; text-align: center; margin-bottom: 5mm; margin-top: 10mm;">GR&R Analysis Charts</h2>
        
        <!-- Average X Bar Chart -->
        <div style="margin-bottom: 15mm;">
          <h3 style="font-size: 3.8mm; font-weight: bold; text-align: center; margin-bottom: 3mm;">Average X Bar Chart</h3>
          <div id="xbar-chart" style="width: 100%; height: 90mm;">
            ${generateXBarChartSVG(study, formData, results)}
          </div>
        </div>
        
        <!-- Range Chart -->
        <div style="margin-bottom: 15mm;">
          <h3 style="font-size: 3.8mm; font-weight: bold; text-align: center; margin-bottom: 3mm;">Range Chart</h3>
          <div id="range-chart" style="width: 100%; height: 90mm;">
            ${generateRangeChartSVG(study, formData, results)}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Page Break -->
    <div style="page-break-before: always;"></div>
    
    <!-- Page 5: Last Chart -->
    <div style="padding: 15mm 15mm 10mm 15mm;">
      <!-- Header - Same as page 1 but with updated page number -->
      <div style="border: 1px solid #000; background-color: #e6e6e6; margin-bottom: 10mm;">
        <div style="display: grid; grid-template-columns: 3fr 6fr 3fr; height: 40mm;">
          <!-- Left: Company Logo + Name -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="height: 20mm; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${HTFimage}" 
                  alt="Company Logo" 
                  style="height: 18mm; width: auto; object-fit: contain;"
                />
              </div>
              <div style="font-weight: bold; font-size: 3mm; line-height: 1.2;">
                HIGH TENSILE<br/>
                FASTNUTS (I) PVT<br/>
                LTD
              </div>
            </div>
          </div>
          
          <!-- Center: Report Title -->
          <div style="border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 4mm;">
            Variable GR&amp;R Study Report
          </div>
          
          <!-- Right: Document Info with updated page number -->
          <div style="font-size: 2.5mm; padding: 1mm;">
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">DOC NO.:</span> ${formData.documentNumber || "QC/23"}
            </div>
            <div style="border-bottom: 1px solid #000; padding: 1mm 0;">
              <span style="font-weight: bold;">REV NO./DT.:</span> ${formData.revisionNumberDate || "02/01.11.15"}
            </div>
            <div style="padding: 1mm 0;">
              <span style="font-weight: bold;">PAGE:</span> 05 OF 05
            </div>
          </div>
        </div>
      </div>
      
      <!-- Part vs Appraiser Chart -->
      <div style="margin-top: 5mm;">
        <h3 style="font-size: 3.8mm; font-weight: bold; text-align: center; margin-bottom: 3mm; margin-top: 10mm;">Part V/s Appraiser Chart</h3>
        <div id="part-appraiser-chart" style="width: 100%; height: 160mm;">
          ${generatePartAppraiserChartSVG(study, formData, results)}
        </div>
      </div>
      
      <div style="margin-top: 10mm; text-align: center; font-size: 2.8mm; color: #666; padding-bottom: 15mm;">
        Report generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </div>
    </div>
  </div>
  `;
  
  return html;
};

// Generate SVG for X-bar chart
const generateXBarChartSVG = (study, formData, results) => {
  const chartData = calculateChartData(formData);
  if (chartData.length === 0) return '<div style="text-align: center; padding: 20px; color: #999;">No data available for chart</div>';
  
  const controlLimits = calculateControlLimits(chartData);
  
  // Determine Y-axis scale
  const yAxisMin = Math.min(controlLimits.lcl - 0.01, Math.min(...chartData.map(d => d.average)));
  const yAxisMax = Math.max(controlLimits.ucl + 0.01, Math.max(...chartData.map(d => d.average)));
  const yAxisRange = yAxisMax - yAxisMin;
  
  // Create SVG path commands for the data line
  let pathData = "";
  let firstPoint = true;
  
  // Create points for data line and markers
  let points = "";
  chartData.forEach((d, i) => {
    const x = 50 + i * 35;
    const y = 150 - ((d.average - yAxisMin) / yAxisRange * 100);
    
    if (firstPoint) {
      pathData += `M ${x} ${y}`;
      firstPoint = false;
    } else {
      pathData += ` L ${x} ${y}`;
    }
    
    // Add data point marker
    points += `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6" stroke="#fff" stroke-width="1" />`;
    // Add data value label
    points += `<text x="${x}" y="${y - 5}" font-size="2.5mm" text-anchor="middle">${d.average.toFixed(3)}</text>`;
  });
  
  return `
  <svg width="100%" height="90mm" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Grid lines -->
    <g stroke="#e0e0e0" stroke-width="0.5">
      ${[0, 25, 50, 75, 100].map(percent => {
        const y = 150 - (percent / 100 * 100);
        return `<line x1="50" y1="${y}" x2="550" y2="${y}" />`;
      }).join('')}
      
      <!-- Vertical grid lines -->
      ${chartData.map((_, i) => {
        const x = 50 + i * 35;
        return `<line x1="${x}" y1="50" x2="${x}" y2="150" />`;
      }).join('')}
    </g>
    
    <!-- Axes -->
    <line x1="50" y1="150" x2="550" y2="150" stroke="#333" stroke-width="1" />
    <line x1="50" y1="50" x2="50" y2="150" stroke="#333" stroke-width="1" />
    
    <!-- Control limits -->
    <line x1="50" y1="${150 - ((controlLimits.ucl - yAxisMin) / yAxisRange * 100)}" x2="550" y2="${150 - ((controlLimits.ucl - yAxisMin) / yAxisRange * 100)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3" />
    <line x1="50" y1="${150 - ((controlLimits.avg - yAxisMin) / yAxisRange * 100)}" x2="550" y2="${150 - ((controlLimits.avg - yAxisMin) / yAxisRange * 100)}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="5,3" />
    <line x1="50" y1="${150 - ((controlLimits.lcl - yAxisMin) / yAxisRange * 100)}" x2="550" y2="${150 - ((controlLimits.lcl - yAxisMin) / yAxisRange * 100)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3" />
    
    <!-- Control limit labels -->
    <text x="45" y="${150 - ((controlLimits.ucl - yAxisMin) / yAxisRange * 100) + 3}" font-size="2.5mm" text-anchor="end" fill="#ef4444">UCL</text>
    <text x="45" y="${150 - ((controlLimits.avg - yAxisMin) / yAxisRange * 100) + 3}" font-size="2.5mm" text-anchor="end" fill="#3b82f6">CL</text>
    <text x="45" y="${150 - ((controlLimits.lcl - yAxisMin) / yAxisRange * 100) + 3}" font-size="2.5mm" text-anchor="end" fill="#ef4444">LCL</text>
    
    <!-- Y-axis labels -->
    ${[0, 25, 50, 75, 100].map(percent => {
      const value = yAxisMin + (yAxisRange * (percent / 100));
      const y = 150 - (percent / 100 * 100);
      return `<text x="40" y="${y + 3}" font-size="2.2mm" text-anchor="end">${value.toFixed(3)}</text>`;
    }).join('')}
    
    <!-- Data line -->
    <path d="${pathData}" stroke="#3b82f6" stroke-width="2" fill="none" />
    
    <!-- Data points -->
    ${points}
    
    <!-- X-axis labels -->
    <g font-size="2.5mm" text-anchor="middle">
      ${chartData.map((_, i) => {
        const x = 50 + i * 35;
        return `<text x="${x}" y="170">${i+1}</text>`;
      }).join('')}
      <text x="300" y="185" font-weight="bold" font-size="2.8mm">Subgroup</text>
    </g>
    
    <text x="20" y="100" font-size="2.8mm" transform="rotate(-90, 20, 100)" text-anchor="middle" font-weight="bold">Average</text>
  </svg>
  `;
};

// Generate SVG for Range chart
const generateRangeChartSVG = (study, formData, results) => {
  const chartData = calculateChartData(formData);
  if (chartData.length === 0) return '<div style="text-align: center; padding: 20px; color: #999;">No data available for chart</div>';
  
  const controlLimits = calculateControlLimits(chartData);
  
  // Determine Y-axis scale (range chart always starts at 0)
  const yAxisMax = Math.max(controlLimits.uclRange * 1.1, Math.max(...chartData.map(d => d.range)));
  const yAxisRange = yAxisMax;
  
  // Create SVG path commands for the data line
  let pathData = "";
  let firstPoint = true;
  
  // Create points for data line and markers
  let points = "";
  chartData.forEach((d, i) => {
    const x = 50 + i * 35;
    const y = 150 - ((d.range) / yAxisRange * 100);
    
    if (firstPoint) {
      pathData += `M ${x} ${y}`;
      firstPoint = false;
    } else {
      pathData += ` L ${x} ${y}`;
    }
    
    // Add data point marker
    points += `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6" stroke="#fff" stroke-width="1" />`;
    // Add data value label
    points += `<text x="${x}" y="${y - 5}" font-size="2.5mm" text-anchor="middle">${d.range.toFixed(3)}</text>`;
  });
  
  return `
  <svg width="100%" height="90mm" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Grid lines -->
    <g stroke="#e0e0e0" stroke-width="0.5">
      ${[0, 25, 50, 75, 100].map(percent => {
        const y = 150 - (percent / 100 * 100);
        return `<line x1="50" y1="${y}" x2="550" y2="${y}" />`;
      }).join('')}
      
      <!-- Vertical grid lines -->
      ${chartData.map((_, i) => {
        const x = 50 + i * 35;
        return `<line x1="${x}" y1="50" x2="${x}" y2="150" />`;
      }).join('')}
    </g>
    
    <!-- Axes -->
    <line x1="50" y1="150" x2="550" y2="150" stroke="#333" stroke-width="1" />
    <line x1="50" y1="50" x2="50" y2="150" stroke="#333" stroke-width="1" />
    
    <!-- Control limits -->
    <line x1="50" y1="${150 - ((controlLimits.uclRange) / yAxisRange * 100)}" x2="550" y2="${150 - ((controlLimits.uclRange) / yAxisRange * 100)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3" />
    <line x1="50" y1="${150 - ((controlLimits.avgRange) / yAxisRange * 100)}" x2="550" y2="${150 - ((controlLimits.avgRange) / yAxisRange * 100)}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="5,3" />
    <line x1="50" y1="150" x2="550" y2="150" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3" />
    
    <!-- Control limit labels -->
    <text x="45" y="${150 - ((controlLimits.uclRange) / yAxisRange * 100) + 3}" font-size="2.5mm" text-anchor="end" fill="#ef4444">UCL</text>
    <text x="45" y="${150 - ((controlLimits.avgRange) / yAxisRange * 100) + 3}" font-size="2.5mm" text-anchor="end" fill="#3b82f6">CL</text>
    <text x="45" y="153" font-size="2.5mm" text-anchor="end" fill="#ef4444">LCL</text>
    
    <!-- Y-axis labels -->
    ${[0, 25, 50, 75, 100].map(percent => {
      const value = yAxisRange * (percent / 100);
      const y = 150 - (percent / 100 * 100);
      return `<text x="40" y="${y + 3}" font-size="2.2mm" text-anchor="end">${value.toFixed(3)}</text>`;
    }).join('')}
    
    <!-- Data line -->
    <path d="${pathData}" stroke="#3b82f6" stroke-width="2" fill="none" />
    
    <!-- Data points -->
    ${points}
    
    <!-- X-axis labels -->
    <g font-size="2.5mm" text-anchor="middle">
      ${chartData.map((_, i) => {
        const x = 50 + i * 35;
        return `<text x="${x}" y="170">${i+1}</text>`;
      }).join('')}
      <text x="300" y="185" font-weight="bold" font-size="2.8mm">Subgroup</text>
    </g>
    
    <text x="20" y="100" font-size="2.8mm" transform="rotate(-90, 20, 100)" text-anchor="middle" font-weight="bold">Range</text>
  </svg>
  `;
};

// Generate SVG for Part vs Appraiser chart
const generatePartAppraiserChartSVG = (study, formData, results) => {
  const { measurementData, numberOfAppraisers, numberOfParts, numberOfTrials } = formData;
  
  // Calculate averages for each appraiser by part
  const chartData = [];
  for (let p = 1; p <= numberOfParts; p++) {
    const partKey = p.toString();
    const appraiserAverages = { part: p };
    
    for (let a = 1; a <= numberOfAppraisers; a++) {
      const appraiserKey = a.toString();
      const appraiserData = measurementData[appraiserKey] || {};
      const partMeasurements = appraiserData[partKey] || {};
      const values = [];
      
      for (let t = 1; t <= numberOfTrials; t++) {
        const trialKey = t.toString();
        const value = partMeasurements[trialKey];
        if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
          values.push(parseFloat(value));
        }
      }
      
      if (values.length > 0) {
        appraiserAverages[`appraiser${a}`] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }
    
    if (Object.keys(appraiserAverages).length > 1) {
      chartData.push(appraiserAverages);
    }
  }
  
  if (chartData.length === 0) return '<div style="text-align: center; padding: 20px; color: #999;">No data available for chart</div>';
  
  // Determine min and max values for Y-axis scaling
  let allValues = [];
  for (let i = 0; i < chartData.length; i++) {
    for (let a = 1; a <= numberOfAppraisers; a++) {
      if (chartData[i][`appraiser${a}`] !== undefined) {
        allValues.push(chartData[i][`appraiser${a}`]);
      }
    }
  }
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const buffer = range * 0.1 || 0.1; // Add 10% buffer or minimum 0.1
  const yAxisMin = minValue - buffer;
  const yAxisMax = maxValue + buffer;
  const yAxisRange = yAxisMax - yAxisMin;
  
  // Generate paths for each appraiser
  const colors = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"];
  let paths = "";
  let points = "";
  
  for (let a = 1; a <= numberOfAppraisers; a++) {
    let pathData = "";
    let firstPoint = true;
    
    chartData.forEach((d, i) => {
      const x = 50 + i * (500 / (numberOfParts - 1 || 1));
      const yValue = d[`appraiser${a}`];
      
      if (yValue !== undefined) {
        const y = 150 - ((yValue - yAxisMin) / yAxisRange * 100);
        
        if (firstPoint) {
          pathData += `M ${x} ${y}`;
          firstPoint = false;
        } else {
          pathData += ` L ${x} ${y}`;
        }
        
        // Add data point marker
        points += `<circle cx="${x}" cy="${y}" r="3" fill="${colors[(a-1) % colors.length]}" stroke="#fff" stroke-width="1" />`;
      }
    });
    
    // Add path for this appraiser
    if (pathData) {
      paths += `<path d="${pathData}" stroke="${colors[(a-1) % colors.length]}" stroke-width="2" fill="none" />`;
    }
  }
  
  return `
  <svg width="100%" height="160mm" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
    <!-- Grid lines -->
    <g stroke="#e0e0e0" stroke-width="0.5">
      ${[0, 25, 50, 75, 100].map(percent => {
        const y = 250 - (percent / 100 * 200);
        return `<line x1="50" y1="${y}" x2="550" y2="${y}" />`;
      }).join('')}
      
      <!-- Vertical grid lines -->
      ${Array.from({length: numberOfParts}, (_, i) => {
        const x = 50 + i * (500 / (numberOfParts - 1 || 1));
        return `<line x1="${x}" y1="50" x2="${x}" y2="250" />`;
      }).join('')}
    </g>
    
    <!-- Axes -->
    <line x1="50" y1="250" x2="550" y2="250" stroke="#333" stroke-width="1" />
    <line x1="50" y1="50" x2="50" y2="250" stroke="#333" stroke-width="1" />
    
    <!-- Y-axis labels -->
    ${[0, 25, 50, 75, 100].map(percent => {
      const value = yAxisMin + (yAxisRange * (percent / 100));
      const y = 250 - (percent / 100 * 200);
      return `<text x="40" y="${y + 3}" font-size="2.2mm" text-anchor="end">${value.toFixed(3)}</text>`;
    }).join('')}
    
    <!-- Legend -->
    <g font-size="2.5mm">
      ${Array.from({length: numberOfAppraisers}, (_, i) => {
        const color = colors[i % colors.length];
        const y = 70 + i * 15;
        return `
          <line x1="560" y1="${y}" x2="580" y2="${y}" stroke="${color}" stroke-width="2" />
          <text x="585" y="${y + 4}" fill="${color}">Appraiser ${i+1}</text>
        `;
      }).join('')}
    </g>
    
    <!-- Data lines -->
    ${paths}
    
    <!-- Data points -->
    ${points}
    
    <!-- X-axis labels -->
    <g font-size="2.5mm" text-anchor="middle">
      ${Array.from({length: numberOfParts}, (_, i) => {
        const x = 50 + i * (500 / (numberOfParts - 1 || 1));
        return `<text x="${x}" y="270">${i+1}</text>`;
      }).join('')}
      <text x="300" y="285" font-weight="bold" font-size="2.8mm">Part</text>
    </g>
    
    <text x="20" y="150" font-size="2.8mm" transform="rotate(-90, 20, 150)" text-anchor="middle" font-weight="bold">Measurement</text>
  </svg>
  `;
};

// Calculate chart data for X-bar and Range charts
const calculateChartData = (formData) => {
  const { measurementData, numberOfAppraisers, numberOfParts, numberOfTrials } = formData;
  const data = [];
  
  let subgroupIndex = 0;
  for (let a = 1; a <= numberOfAppraisers; a++) {
    const appraiserKey = a.toString();
    const appraiserData = measurementData[appraiserKey] || {};
    
    for (let p = 1; p <= numberOfParts; p++) {
      const partKey = p.toString();
      const partData = appraiserData[partKey] || {};
      const values = [];
      
      for (let t = 1; t <= numberOfTrials; t++) {
        const trialKey = t.toString();
        const value = partData[trialKey];
        if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
          values.push(parseFloat(value));
        }
      }
      
      if (values.length > 0) {
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const range = Math.max(...values) - Math.min(...values);
        subgroupIndex++;
        data.push({
          subgroup: subgroupIndex,
          average: Number(average.toFixed(3)),
          range: Number(range.toFixed(3)),
          appraiser: a,
          part: p
        });
      }
    }
  }
  
  return data;
};

// Calculate control limits for X-bar and Range charts
const calculateControlLimits = (chartData) => {
  if (chartData.length === 0) return { 
    ucl: 0, lcl: 0, avg: 0, uclRange: 0, lclRange: 0, avgRange: 0 
  };
  
  const averages = chartData.map(d => d.average);
  const ranges = chartData.map(d => d.range);
  
  const avg = averages.reduce((a, b) => a + b, 0) / averages.length;
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  
  // X-bar chart limits (using A2 constant for n=3)
  const A2 = 0.577;
  const ucl = avg + (A2 * avgRange);
  const lcl = avg - (A2 * avgRange);
  
  // Range chart limits (using D3=0 and D4=2.574 constants for n=3)
  const D4 = 2.574;
  const uclRange = D4 * avgRange;
  const lclRange = 0;
  
  return { ucl, lcl, avg, uclRange, lclRange, avgRange };
};

const generateMeasurementTableHTML = (measurementData, formData, section = 'all') => {
  if (!measurementData || Object.keys(measurementData).length === 0) {
    return "";
  }
  
  const overallStats = calculateOverallStats(
    measurementData,
    formData.numberOfAppraisers,
    formData.numberOfParts,
    formData.numberOfTrials
  );
  
  let html = "";
  
  if (section === 'top' || section === 'all') {
    html += `
    <div style="border: 1px solid #ccc; padding: 8mm; margin-bottom: 10mm; font-size: 2.8mm;">
      <table style="width: 100%; border-collapse: collapse; font-size: 2.5mm;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #ccc; padding: 3mm; text-align: left;">Trial #</th>
    `;
    
    for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
      html += `<th style="border: 1px solid #ccc; padding: 3mm; text-align: center;">Part ${partIndex}</th>`;
    }
    
    html += `
            <th style="border: 1px solid #ccc; padding: 3mm; text-align: center;">Average</th>
            <th style="border: 1px solid #ccc; padding: 3mm; text-align: center;">Range</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add half of the appraisers for the top section
    const appraiserCount = formData.numberOfAppraisers;
    const appraisersToShow = section === 'top' ? Math.ceil(appraiserCount / 2) : appraiserCount;
    
    for (let appraiserNum = 1; appraiserNum <= appraisersToShow; appraiserNum++) {
      const appraiserKey = appraiserNum.toString();
      const appraiserMeasurements = measurementData[appraiserKey] || {};
      const stats = calculateAppraiserStats(measurementData, appraiserNum, formData.numberOfParts, formData.numberOfTrials);
      const isOutOfControl = overallStats.outOfControlAppraisers.includes(appraiserNum);
      
      html += `
      <tr>
        <td colspan="${formData.numberOfParts + 3}" style="border: 1px solid #ccc; padding: 3mm; font-weight: bold; background-color: ${isOutOfControl ? '#ffcccc' : '#f0f0f0'}; color: ${isOutOfControl ? '#cc0000' : '#000'};">
          Appraiser #${appraiserNum}
        </td>
      </tr>
      `;
      
      for (let trialIndex = 1; trialIndex <= formData.numberOfTrials; trialIndex++) {
        const trialKey = trialIndex.toString();
        const trialValues = [];
        
        html += `<tr><td style="border: 1px solid #ccc; padding: 3mm; font-weight: bold;">Trial ${trialIndex}</td>`;
        
        for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
          const partKey = partIndex.toString();
          const partMeasurements = appraiserMeasurements[partKey] || {};
          const value = partMeasurements[trialKey] || "";
          
          if (value !== "" && !isNaN(value)) {
            trialValues.push(parseFloat(value));
          }
          
          html += `<td style="border: 1px solid #ccc; padding: 3mm; text-align: center;">${value !== "" ? parseFloat(value).toFixed(3) : "—"}</td>`;
        }
        
        const avg = trialValues.length > 0 ? (trialValues.reduce((a, b) => a + b, 0) / trialValues.length).toFixed(3) : "—";
        const range = trialValues.length > 1 ? (Math.max(...trialValues) - Math.min(...trialValues)).toFixed(3) : "—";
        
        html += `
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center;">${avg}</td>
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center;">${range}</td>
        </tr>`;
      }
      
      // Add footer with averages and ranges
      html += `
        <tr style="background-color: #f0f0f0; border-top: 2px solid #666;">
          <td style="border: 1px solid #ccc; padding: 3mm; font-weight: bold;">Average</td>
      `;
      
      for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
        const avg = stats.partAverages[partIndex] !== null ? stats.partAverages[partIndex].toFixed(3) : "—";
        html += `<td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-weight: bold;">${avg}</td>`;
      }
      
      html += `
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-weight: bold; color: ${isOutOfControl ? '#cc0000' : '#000'};">${stats.overallAverage.toFixed(2)}</td>
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-style: italic; color: ${isOutOfControl ? '#cc0000' : '#666'};">X${String.fromCharCode(96 + appraiserNum)}=</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="border: 1px solid #ccc; padding: 3mm; font-weight: bold;">Range</td>
      `;
      
      for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
        const range = stats.partRanges[partIndex] !== null ? stats.partRanges[partIndex].toFixed(3) : "—";
        html += `<td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-weight: bold;">${range}</td>`;
      }
      
      html += `
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-weight: bold; color: ${isOutOfControl ? '#cc0000' : '#000'};">${stats.overallRange.toFixed(2)}</td>
          <td style="border: 1px solid #ccc; padding: 3mm; text-align: center; font-style: italic; color: ${isOutOfControl ? '#cc0000' : '#666'};">r${String.fromCharCode(96 + appraiserNum)}=</td>
        </tr>
      `;
    }
    
    html += `
        </tbody>
      </table>
    </div>
    `;
  }
  
  if (section === 'bottom' || section === 'all') {
    html += `
    <div style="background-color: #ffffcc; border: 2px solid #ffcc00; margin-top: 10mm; padding: 8mm; font-size: 2.8mm;">
      <table style="width: 100%; border-collapse: collapse; font-size: 2.5mm;">
        <thead>
          <tr style="background-color: #ffeb99; border-bottom: 2px solid #ffcc00;">
            <th style="border: 1px solid #ffcc00; padding: 3mm; text-align: left;">Average of Appraiser</th>
    `;
    
    for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
      html += `<th style="border: 1px solid #ffcc00; padding: 3mm; text-align: center;">Part ${partIndex}</th>`;
    }
    
    html += `
            <th style="border: 1px solid #ffcc00; padding: 3mm; text-align: center;">X</th>
            <th style="border: 1px solid #ffcc00; padding: 3mm; text-align: center;">Rp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ffcc00; padding: 3mm; font-weight: bold;">Average</td>
    `;
    
    for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
      const avg = overallStats.averageOfAppraiserAverages[partIndex] !== null
        ? overallStats.averageOfAppraiserAverages[partIndex].toFixed(3)
        : "—";
      html += `<td style="border: 1px solid #ffcc00; padding: 3mm; text-align: center; font-weight: bold;">${avg}</td>`;
    }
    
    html += `
            <td style="border: 1px solid #ffcc00; padding: 3mm; text-align: center; font-weight: bold;">${overallStats.X.toFixed(2)}</td>
            <td style="border: 1px solid #ffcc00; padding: 3mm; text-align: center; font-weight: bold;">${overallStats.Rp.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Add Out of Control Status
    if (overallStats.outOfControlAppraisers.length > 0) {
      const appraiserLetters = overallStats.outOfControlAppraisers.map(num => String.fromCharCode(64 + num)).join(", ");
      html += `
      <div style="border-top: 2px solid #ffcc00; padding: 8mm; margin-top: 8mm;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm;">
          <span style="color: #cc0000; font-weight: bold; font-size: 2.5mm;">APPRAISER</span>
          <span style="color: #cc0000; font-weight: bold; font-size: 3.5mm;">${appraiserLetters}</span>
          <span style="color: #cc0000; font-weight: bold; font-size: 2.5mm;">OUT OF CONTROL</span>
        </div>
        <div style="color: #cc0000; font-size: 2.2mm; font-style: italic;">
          Note: Repeat the trials, using the same appraiser and equipment used and recompute, until the app. improves
        </div>
      </div>
      `;
    }
    
    // Add Summary Statistics
    html += `
    <div style="border-top: 2px solid #ffcc00; padding: 6mm; margin-top: 8mm;">
      <div style="display: flex; gap: 15mm; font-size: 2.8mm;">
        <div>
          <span style="color: #cc0000; font-weight: bold;">R=</span>
          <span style="color: #cc0000;">→</span>
          <span style="color: #cc0000; font-weight: bold;">${overallStats.R.toFixed(2)}</span>
        </div>
        <div>
          <span style="color: #cc0000; font-weight: bold;">XDIFF=</span>
          <span style="color: #cc0000;">→</span>
          <span style="color: #cc0000; font-weight: bold;">${overallStats.XDIFF.toFixed(2)}</span>
        </div>
        <div>
          <span style="color: #cc0000; font-weight: bold;">UCLR=</span>
          <span style="color: #cc0000;">→</span>
          <span style="color: #cc0000; font-weight: bold;">${overallStats.UCLR.toFixed(2)}</span>
        </div>
      </div>
    </div>
    </div>
    `;
  }
  
  return html;
};