import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { calculateAppraiserStats, calculateOverallStats } from "./grrCalculations";

export const generateGRRPDF = async (study) => {
  try {
    // Create a temporary container for PDF generation
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "210mm"; // A4 width
    container.style.padding = "20mm";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(container);

    // Build HTML content
    const htmlContent = buildPDFContent(study);
    container.innerHTML = htmlContent;

    // Wait for images/charts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: container.offsetWidth,
      height: container.offsetHeight
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
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
    pageInfo: study.pageInfo
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
    k3: study.k3
  };

  const formatNum = (num, decimals = 5) => {
    if (num === null || num === undefined) return "0.00000";
    return Number(num).toFixed(decimals);
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return "0.00";
    return Number(num).toFixed(2);
  };

  const SQUARED = "²";

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #666; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
          ${formData.reportTitle || "Variable GR&R Study Report"}
        </h1>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px;">
          <div><strong>DOC NO.:</strong> ${formData.documentNumber || "QC/23"}</div>
          <div><strong>REV NO./DT.:</strong> ${formData.revisionNumberDate || "02/01.11.15"}</div>
          <div><strong>PAGE:</strong> ${formData.pageInfo || "01 OF 01"}</div>
          <div style="text-align: right;"><strong>${formData.companyName || "HIGH TENSILE FASTNUTS (I) PVT LTD"}</strong></div>
        </div>
      </div>

      <!-- Study Parameters -->
      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 11px;">
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

      <!-- Measurement Data Table -->
      ${generateMeasurementTableHTML(study.measurementData || {}, formData)}

      <!-- Analysis Results -->
      <div style="border: 2px solid #666; margin-top: 20px; page-break-inside: avoid;">
        <div style="background-color: #ffcc99; padding: 10px; border-bottom: 2px solid #666;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0;">Measurement Unit Analysis</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr);">
          <!-- Left Column -->
          <div style="border-right: 2px solid #666; padding: 10px;">
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Repeatability - Equipment Variation (EV)</div>
              <div style="font-size: 9px; color: #666;">EV = R x K1</div>
              <div style="font-size: 11px; font-weight: bold;">EV = ${formatNum(results.equipmentVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Reproducibility - Appraiser Variation (AV)</div>
              <div style="font-size: 9px; color: #666;">AV = {(XDIFF x K2)${SQUARED} - (EV${SQUARED}/nr)}^(1/2)</div>
              <div style="font-size: 11px; font-weight: bold;">AV = ${formatNum(results.appraiserVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Repeatability & Reproducibility (GRR)</div>
              <div style="font-size: 9px; color: #666;">GRR = {(EV${SQUARED} + AV${SQUARED})}^(1/2)</div>
              <div style="font-size: 11px; font-weight: bold;">GRR = ${formatNum(results.grrValue)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Part Variation (PV)</div>
              <div style="font-size: 9px; color: #666;">PV = Rp x K3</div>
              <div style="font-size: 11px; font-weight: bold;">PV = ${formatNum(results.partVariation)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Total Variation (TV)</div>
              <div style="font-size: 9px; color: #666;">TV = {(GRR${SQUARED} + PV${SQUARED})}^(1/2)</div>
              <div style="font-size: 11px; font-weight: bold;">TV = ${formatNum(results.totalVariation)}</div>
            </div>
          </div>

          <!-- Middle Column -->
          <div style="border-right: 2px solid #666; padding: 10px;">
            <div style="background-color: #ffcc99; padding: 10px; border-bottom: 2px solid #666; margin-bottom: 5px;">
              <h3 style="font-size: 14px; font-weight: bold; margin: 0;">% Total Variation (TV)</h3>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">% EV</div>
              <div style="font-size: 9px; color: #666;">% EV = 100 (EV/TV)</div>
              <div style="font-size: 11px; font-weight: bold;">% EV = ${formatPercent(results.percentEV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">% AV</div>
              <div style="font-size: 9px; color: #666;">% AV = 100 (AV/TV)</div>
              <div style="font-size: 11px; font-weight: bold;">% AV = ${formatPercent(results.percentAV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">% GRR</div>
              <div style="font-size: 9px; color: #666;">% GRR = 100 (GRR/TV)</div>
              <div style="font-size: 11px; font-weight: bold;">% GRR = ${formatPercent(results.percentGRR)}</div>
              <div style="font-size: 9px; padding: 3px; margin-top: 3px; background-color: ${results.percentGRR <= 10 ? "#90EE90" : results.percentGRR <= 30 ? "#FFE4B5" : "#FFB6C1"};">
                ${results.percentGRR <= 10 ? "Gage system O.K" : results.percentGRR <= 30 ? "Gage system Marginal" : "Gage system Unacceptable"}
              </div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #ccc;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">% PV</div>
              <div style="font-size: 9px; color: #666;">% PV = 100 (PV/TV)</div>
              <div style="font-size: 11px; font-weight: bold;">% PV = ${formatPercent(results.percentPV)}</div>
            </div>
            <div style="background-color: #ffffcc; padding: 8px;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">ndc (Number of Distinct Categories)</div>
              <div style="font-size: 9px; color: #666;">ndc = 1.41(PV/GRR)</div>
              <div style="font-size: 11px; font-weight: bold;">ndc = ${results.numberOfDistinctCategories || 0}</div>
              <div style="font-size: 9px; padding: 3px; margin-top: 3px; background-color: ${results.numberOfDistinctCategories >= 5 ? "#90EE90" : "#FFE4B5"};">
                ${results.numberOfDistinctCategories >= 5 ? "Gage discrimination is acceptable" : "Gage discrimination may be marginal"}
              </div>
            </div>
          </div>

          <!-- Right Column - K Tables -->
          <div style="padding: 10px;">
            <div style="background-color: #ffcc99; padding: 10px; border-bottom: 2px solid #666; margin-bottom: 10px;">
              <h3 style="font-size: 14px; font-weight: bold; margin: 0;">Standard Tables</h3>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">K1 Table (for Trials)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 9px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 3px;">Trials</th>
                    <th style="border: 1px solid #ccc; padding: 3px;">K1</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">2</td><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">0.8865</td></tr>
                  <tr><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">3</td><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">0.5907</td></tr>
                </tbody>
              </table>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">K2 Table (for Appraiser)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 9px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 3px;">Appraiser</th>
                    <th style="border: 1px solid #ccc; padding: 3px;">K2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">2</td><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">0.7087</td></tr>
                  <tr><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">3</td><td style="border: 1px solid #ccc; padding: 3px; text-align: center;">0.5236</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">K3 Table (for Parts)</div>
              <table style="width: 100%; border: 1px solid #ccc; font-size: 9px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ccc; padding: 3px;">Parts</th>
                    <th style="border: 1px solid #ccc; padding: 3px;">K3</th>
                  </tr>
                </thead>
                <tbody>
                  ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(parts => `
                    <tr>
                      <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${parts}</td>
                      <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">
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
  `;

  return html;
};

const generateMeasurementTableHTML = (measurementData, formData) => {
  if (!measurementData || Object.keys(measurementData).length === 0) {
    return "";
  }

  const overallStats = calculateOverallStats(
    measurementData,
    formData.numberOfAppraisers,
    formData.numberOfParts,
    formData.numberOfTrials
  );

  let html = `
    <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Measurement Data</h3>
  `;

  for (let appraiserNum = 1; appraiserNum <= formData.numberOfAppraisers; appraiserNum++) {
    const appraiserKey = appraiserNum.toString();
    const appraiserMeasurements = measurementData[appraiserKey] || {};
    const stats = calculateAppraiserStats(measurementData, appraiserNum, formData.numberOfParts, formData.numberOfTrials);
    const isOutOfControl = overallStats.outOfControlAppraisers.includes(appraiserNum);

    html += `
      <div style="border: 1px solid #ccc; margin-bottom: 15px;">
        <div style="background-color: ${isOutOfControl ? '#ffcccc' : '#f0f0f0'}; padding: 8px; border-bottom: 1px solid #ccc;">
          <h4 style="font-size: 12px; font-weight: bold; margin: 0; color: ${isOutOfControl ? '#cc0000' : '#000'};">Appraiser #${appraiserNum}</h4>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f9f9f9;">
              <th style="border: 1px solid #ccc; padding: 5px; text-align: left;">Trial #</th>
    `;

    for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
      html += `<th style="border: 1px solid #ccc; padding: 5px; text-align: center;">Part ${partIndex}</th>`;
    }

    html += `
              <th style="border: 1px solid #ccc; padding: 5px; text-align: center;">Average</th>
              <th style="border: 1px solid #ccc; padding: 5px; text-align: center;">Range</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let trialIndex = 1; trialIndex <= formData.numberOfTrials; trialIndex++) {
      const trialKey = trialIndex.toString();
      const trialValues = [];

      html += `<tr><td style="border: 1px solid #ccc; padding: 5px; font-weight: bold;">Trial ${trialIndex}</td>`;

      for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
        const partKey = partIndex.toString();
        const partMeasurements = appraiserMeasurements[partKey] || {};
        const value = partMeasurements[trialKey] || "";

        if (value !== "" && !isNaN(value)) {
          trialValues.push(parseFloat(value));
        }

        html += `<td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${value !== "" ? parseFloat(value).toFixed(3) : "—"}</td>`;
      }

      const avg = trialValues.length > 0 ? (trialValues.reduce((a, b) => a + b, 0) / trialValues.length).toFixed(3) : "—";
      const range = trialValues.length > 1 ? (Math.max(...trialValues) - Math.min(...trialValues)).toFixed(3) : "—";

      html += `
        <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${avg}</td>
        <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${range}</td>
      </tr>`;
    }

    // Add footer with averages and ranges
    html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0; border-top: 2px solid #666;">
              <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold;">Average</td>
    `;
    
    for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
      const avg = stats.partAverages[partIndex] !== null ? stats.partAverages[partIndex].toFixed(3) : "—";
      html += `<td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;">${avg}</td>`;
    }
    
    html += `
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold; color: ${isOutOfControl ? '#cc0000' : '#000'};">${stats.overallAverage.toFixed(2)}</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-style: italic; color: ${isOutOfControl ? '#cc0000' : '#666'};">X${String.fromCharCode(96 + appraiserNum)}=</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
              <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold;">Range</td>
    `;
    
    for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
      const range = stats.partRanges[partIndex] !== null ? stats.partRanges[partIndex].toFixed(3) : "—";
      html += `<td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;">${range}</td>`;
    }
    
    html += `
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold; color: ${isOutOfControl ? '#cc0000' : '#000'};">${stats.overallRange.toFixed(2)}</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-style: italic; color: ${isOutOfControl ? '#cc0000' : '#666'};">r${String.fromCharCode(96 + appraiserNum)}=</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Add Average of Appraiser Average Section
  html += `
    <div style="background-color: #ffffcc; border: 2px solid #ffcc00; margin-top: 15px; padding: 10px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background-color: #ffeb99; border-bottom: 2px solid #ffcc00;">
            <th style="border: 1px solid #ffcc00; padding: 5px; text-align: left;">Average of Appraiser</th>
  `;
  
  for (let partIndex = 1; partIndex <= formData.numberOfParts; partIndex++) {
    html += `<th style="border: 1px solid #ffcc00; padding: 5px; text-align: center;">Part ${partIndex}</th>`;
  }
  
  html += `
            <th style="border: 1px solid #ffcc00; padding: 5px; text-align: center;">X</th>
            <th style="border: 1px solid #ffcc00; padding: 5px; text-align: center;">Rp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ffcc00; padding: 5px; font-weight: bold;">Average</td>
  `;
  
  for (let partIndex = 0; partIndex < formData.numberOfParts; partIndex++) {
    const avg = overallStats.averageOfAppraiserAverages[partIndex] !== null 
      ? overallStats.averageOfAppraiserAverages[partIndex].toFixed(3) 
      : "—";
    html += `<td style="border: 1px solid #ffcc00; padding: 5px; text-align: center; font-weight: bold;">${avg}</td>`;
  }
  
  html += `
            <td style="border: 1px solid #ffcc00; padding: 5px; text-align: center; font-weight: bold;">${overallStats.X.toFixed(2)}</td>
            <td style="border: 1px solid #ffcc00; padding: 5px; text-align: center; font-weight: bold;">${overallStats.Rp.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
  `;
  
  // Add Out of Control Status
  if (overallStats.outOfControlAppraisers.length > 0) {
    const appraiserLetters = overallStats.outOfControlAppraisers.map(num => String.fromCharCode(64 + num)).join(", ");
    html += `
      <div style="border-top: 2px solid #ffcc00; padding: 10px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="color: #cc0000; font-weight: bold; font-size: 11px;">APPRAISER</span>
          <span style="color: #cc0000; font-weight: bold; font-size: 14px;">${appraiserLetters}</span>
          <span style="color: #cc0000; font-weight: bold; font-size: 11px;">OUT OF CONTROL</span>
        </div>
        <div style="color: #cc0000; font-size: 9px; font-style: italic;">
          Note: Repeat the trials, using the same appraiser and equipment used and recompute, until the app. improves
        </div>
      </div>
    `;
  }
  
  // Add Summary Statistics
  html += `
      <div style="border-top: 2px solid #ffcc00; padding: 8px; margin-top: 10px;">
        <div style="display: flex; gap: 20px; font-size: 10px;">
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

  html += `</div>`;
  return html;
};
