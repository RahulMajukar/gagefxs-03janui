import React from "react";

const SQUARED = String.fromCharCode(178); // ² superscript 2

const GRRResults = ({ results, formData }) => {
  if (!results) return null;

  const {
    equipmentVariation: EV,
    appraiserVariation: AV,
    grrValue: GRR,
    partVariation: PV,
    totalVariation: TV,
    percentEV,
    percentAV,
    percentGRR,
    percentPV,
    numberOfDistinctCategories: ndc,
    averageRange: R,
    xDiff,
    rangeOfPartAverages: Rp,
    k1,
    k2,
    k3
  } = results;

  const tolerance = formData.upperSpecification - formData.lowerSpecification;
  const nr = formData.numberOfParts * formData.numberOfTrials;

  // Format numbers for display
  const formatNum = (num, decimals = 5) => {
    if (num === null || num === undefined) return "0.00000";
    return Number(num).toFixed(decimals);
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return "0.00";
    return Number(num).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Section matching image 2 */}
      <div className="border-2 border-gray-400 rounded-lg overflow-hidden">

        
        <div className="grid grid-cols-3 gap-0 min-h-[600px]">
          {/* Left Column: Measurement Unit Analysis */}
          <div className="col-span-1 border-r-2 border-gray-400 flex flex-col">
            <div className="px-6 py-3 bg-orange-100 border-b border-gray-300 ">
              <h4 className="text-lg font-bold text-gray-800 text-center"> Measurement Unit Analysis</h4>
            </div>
            <div className="flex-1 space-y-0">
              {/* EV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">Repeatability - Equipment Variation (EV)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">EV = R x K1</div>
                <div className="text-xs text-gray-600 mb-1">
                  EV = {formatNum(R, 3)} x {formatNum(k1, 4)}
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">EV = {formatNum(EV, 5)}</div>
              </div>

              {/* AV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">Reproducibility - Appraiser Variation (AV)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">AV = {(xDiff ? `{(${formatNum(xDiff, 2)} x ${formatNum(k2, 4)})${SQUARED} - (${formatNum(EV, 5)}${SQUARED}/${nr})}` : "{...")}^(1/2)</div>
                <div className="text-xs text-gray-600 mb-1">
                  AV = {`{(${formatNum(xDiff * k2, 5)})${SQUARED} - (${formatNum(EV * EV, 5)}/${nr})}^(1/2)`}
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">AV = {formatNum(AV, 5)}</div>
              </div>

              {/* GRR */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">Repeatability & Reproducibility (GRR)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">GRR = {(EV !== undefined ? `{(EV${SQUARED} + AV${SQUARED})}` : "{...")}^(1/2)</div>
                <div className="text-xs text-gray-600 mb-1">
                  GRR = {`{(${formatNum(EV, 5)}${SQUARED} + ${formatNum(AV, 5)}${SQUARED})}^(1/2)`}
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">GRR = {formatNum(GRR, 5)}</div>
              </div>

              {/* PV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">Part Variation (PV)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">PV = Rp x K3</div>
                <div className="text-xs text-gray-600 mb-1">
                  PV = {formatNum(Rp, 3)} x {formatNum(k3, 4)}
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">PV = {formatNum(PV, 5)}</div>
              </div>

              {/* TV */}
              <div className="bg-yellow-50 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">Total Variation (TV)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">TV = {(GRR !== undefined ? `{(GRR${SQUARED} + PV${SQUARED})}` : "{...")}^(1/2)</div>
                <div className="text-xs text-gray-600 mb-1">
                  TV = {`{(${formatNum(GRR, 5)}${SQUARED} + ${formatNum(PV, 5)}${SQUARED})}^(1/2)`}
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">TV = {formatNum(TV, 5)}</div>
              </div>
            </div>
          </div>

          {/* Middle Column: % Total Variation */}
          <div className="col-span-1 border-r-2 border-gray-400 flex flex-col">
            <div className="px-6 py-3 bg-orange-100 border-b border-gray-300">
              <h4 className="text-lg font-bold text-gray-800 text-center">% Total Variation (TV)</h4>
            </div>
            <div className="flex-1 space-y-0">
              {/* % EV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">% EV</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">% EV = 100 (EV/TV)</div>
                <div className="text-xs text-gray-600 mb-1">
                  % EV = 100({formatNum(EV, 5)}/{formatNum(TV, 5)})
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">% EV = {formatPercent(percentEV)}</div>
              </div>

              {/* % AV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">% AV</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">% AV = 100 (AV/TV)</div>
                <div className="text-xs text-gray-600 mb-1">
                  % AV = 100({formatNum(AV, 5)}/{formatNum(TV, 5)})
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">% AV = {formatPercent(percentAV)}</div>
              </div>

              {/* % GRR */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">% GRR</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">% GRR = 100 (GRR/TV)</div>
                <div className="text-xs text-gray-600 mb-1">
                  % GRR = 100({formatNum(GRR, 5)}/{formatNum(TV, 5)})
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">% GRR = {formatPercent(percentGRR)}</div>
                <div className={`mt-3 px-3 py-2 rounded text-xl  font-bold ${
                  percentGRR <= 10 ? "bg-green-100 text-green-800 border border-green-300" :
                  percentGRR <= 30 ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                  "bg-red-100 text-red-800 border border-red-300"
                }`}>
                  {percentGRR <= 10 ? "✓ Gage system O.K" :
                   percentGRR <= 30 ? "⚠ Gage system Marginal" :
                   "✗ Gage system Unacceptable"}
                </div>
              </div>

              {/* % PV */}
              <div className="bg-yellow-50 border-b border-gray-300 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">% PV</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">% PV = 100 (PV/TV)</div>
                <div className="text-xs text-gray-600 mb-1">
                  % PV = 100({formatNum(PV, 5)}/{formatNum(TV, 5)})
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">% PV = {formatPercent(percentPV)}</div>
              </div>

              {/* ndc */}
              <div className="bg-yellow-50 p-4">
                <div className="text-sm font-bold text-gray-800 mb-2">ndc (Number of Distinct Categories)</div>
                <div className="text-xs text-gray-600 mb-1 font-medium">ndc = 1.41(PV/GRR)</div>
                <div className="text-xs text-gray-600 mb-1">
                  ndc = 1.41({formatNum(PV, 5)}/{formatNum(GRR, 5)})
                </div>
                <div className="text-base font-bold text-gray-900 mt-2">ndc = {ndc || 0}</div>
                <div className={`mt-3 px-3 py-2 rounded text-xl font-bold ${
                  ndc >= 5 ? "bg-green-100 text-green-800 border border-green-300" : 
                  "bg-yellow-100 text-yellow-800 border border-yellow-300"
                }`}>
                  {ndc >= 5 ? "✓ Gage discrimination is acceptable" : "⚠ Gage discrimination may be marginal"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Standard Tables */}
          <div className="col-span-1 flex flex-col">
            <div className="px-6 py-3 bg-orange-100 border-b border-gray-300">
              <h4 className="text-lg font-bold text-gray-800 text-center">Standard Tables</h4>
            </div>
            <div className="flex-1 p-4 space-y-6">
              {/* K1 Table */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3">K1 Table (for Trials)</div>
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">Trials</th>
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">K1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">2</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.8865</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">3</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.5907</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">4</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.4857</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">5</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.4299</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* K2 Table */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3">K2 Table (for Appraiser)</div>
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">Appraiser</th>
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">K2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">2</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.7087</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">3</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.5236</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">4</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.4464</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-center">5</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">0.4032</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* K3 Table */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3">K3 Table (for Parts)</div>
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">Parts</th>
                      <th className="border border-gray-300 px-3 py-2 font-semibold w-1/2 text-center">K3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(parts => (
                      <tr key={parts}>
                        <td className="border border-gray-300 px-3 py-2 text-center">{parts}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {parts === 2 ? "0.7087" :
                           parts === 3 ? "0.5236" :
                           parts === 4 ? "0.4464" :
                           parts === 5 ? "0.4032" :
                           parts === 6 ? "0.3745" :
                           parts === 7 ? "0.3534" :
                           parts === 8 ? "0.3378" :
                           parts === 9 ? "0.3247" :
                           "0.3145"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRRResults;