// Shared utility functions for GRR calculations

export const calculateAppraiserStats = (measurementData, appraiserNum, numberOfParts, numberOfTrials) => {
  const appraiserKey = appraiserNum.toString();
  const appraiserData = measurementData[appraiserKey] || {};
  
  const partAverages = [];
  const partRanges = [];
  
  for (let partIndex = 1; partIndex <= numberOfParts; partIndex++) {
    const partKey = partIndex.toString();
    const partData = appraiserData[partKey] || {};
    const values = [];
    
    for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
      const trialKey = trialIndex.toString();
      const value = partData[trialKey];
      if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
        values.push(parseFloat(value));
      }
    }
    
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const range = Math.max(...values) - Math.min(...values);
      partAverages.push(avg);
      partRanges.push(range);
    } else {
      partAverages.push(null);
      partRanges.push(null);
    }
  }
  
  const overallAverage = partAverages.filter(a => a !== null).length > 0
    ? partAverages.filter(a => a !== null).reduce((a, b) => a + b, 0) / partAverages.filter(a => a !== null).length
    : 0;
  
  const overallRange = partRanges.filter(r => r !== null).length > 0
    ? partRanges.filter(r => r !== null).reduce((a, b) => a + b, 0) / partRanges.filter(r => r !== null).length
    : 0;
  
  return { partAverages, partRanges, overallAverage, overallRange };
};

export const calculateOverallStats = (measurementData, numberOfAppraisers, numberOfParts, numberOfTrials) => {
  // Calculate average of appraiser averages for each part
  // This calculates: For each part, get the average from each appraiser, then average those appraiser averages
  const averageOfAppraiserAverages = [];
  const appraiserOverallAverages = [];
  const appraiserOverallRanges = [];
  
  for (let partIndex = 1; partIndex <= numberOfParts; partIndex++) {
    const partKey = partIndex.toString();
    const partAverages = []; // Will store average for each appraiser for this part
    
    // Loop through ALL appraisers (1, 2, 3, etc.)
    for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
      const appraiserKey = appraiserNum.toString();
      const appraiserData = measurementData[appraiserKey] || {};
      const partData = appraiserData[partKey] || {};
      const values = [];
      
      // Get all trial values for this appraiser-part combination
      for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
        const trialKey = trialIndex.toString();
        const value = partData[trialKey];
        if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
          values.push(parseFloat(value));
        }
      }
      
      // Calculate average for this appraiser for this part
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        partAverages.push(avg); // Add this appraiser's average to the list
      }
    }
    
    // Calculate the average of all appraisers' averages for this part
    if (partAverages.length > 0) {
      const avgOfAverages = partAverages.reduce((a, b) => a + b, 0) / partAverages.length;
      averageOfAppraiserAverages.push(avgOfAverages);
    } else {
      averageOfAppraiserAverages.push(null);
    }
  }
  
  // Calculate overall averages and ranges for each appraiser
  for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
    const stats = calculateAppraiserStats(measurementData, appraiserNum, numberOfParts, numberOfTrials);
    appraiserOverallAverages.push(stats.overallAverage);
    appraiserOverallRanges.push(stats.overallRange);
  }
  
  // Calculate R (average of all appraiser ranges)
  const R = appraiserOverallRanges.length > 0
    ? appraiserOverallRanges.reduce((a, b) => a + b, 0) / appraiserOverallRanges.length
    : 0;
  
  // Calculate XDIFF (difference between max and min appraiser averages)
  const XDIFF = appraiserOverallAverages.length > 0
    ? Math.max(...appraiserOverallAverages) - Math.min(...appraiserOverallAverages)
    : 0;
  
  // Calculate UCLR (Upper Control Limit for Range) - D4 * R (for n=3, D4=2.574)
  const D4 = 2.574; // For 3 trials
  const UCLR = R * D4;
  
  // Calculate Rp (Range of part averages)
  const Rp = averageOfAppraiserAverages.filter(a => a !== null).length > 0
    ? Math.max(...averageOfAppraiserAverages.filter(a => a !== null)) - Math.min(...averageOfAppraiserAverages.filter(a => a !== null))
    : 0;
  
  // Calculate overall average X
  const X = averageOfAppraiserAverages.filter(a => a !== null).length > 0
    ? averageOfAppraiserAverages.filter(a => a !== null).reduce((a, b) => a + b, 0) / averageOfAppraiserAverages.filter(a => a !== null).length
    : 0;
  
  // Detect out-of-control appraisers
  // An appraiser is out of control if their range exceeds UCLR
  // UCLR = D4 * R, where D4 = 2.574 for 3 trials
  const outOfControlAppraisers = [];
  
  appraiserOverallRanges.forEach((range, index) => {
    // Only mark as out of control if UCLR is meaningful (> 0) and range exceeds it
    // Also check if range is significantly higher than average (more than 2x) when UCLR is very small
    if (UCLR > 0.001) {
      // Standard case: range exceeds UCLR
      if (range > UCLR) {
        outOfControlAppraisers.push(index + 1);
      }
    } else {
      // When UCLR is 0 or very small, check if this appraiser's range is significantly different
      // Only mark as out of control if range is much higher than others
      const avgRange = appraiserOverallRanges.reduce((a, b) => a + b, 0) / appraiserOverallRanges.length;
      if (range > (avgRange * 2.5) && range > 0.005) {
        outOfControlAppraisers.push(index + 1);
      }
    }
  });
  
  return {
    averageOfAppraiserAverages,
    appraiserOverallAverages,
    appraiserOverallRanges,
    R,
    XDIFF,
    UCLR,
    Rp,
    X,
    outOfControlAppraisers
  };
};
