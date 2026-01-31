import React, { useEffect, useState } from "react";
import "./App.css";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const SYSTEM_CONFIG = {
  region: "Tirupati District",
  masterPlanYear: 2030,
  analysisPeriod: { start: 2023, end: 2024 },
  dataVersion: "v2.1 (Sentinel-2)",
  temporalReady: true
};

function App() {
  const [data, setData] = useState([]);
  const [timeData, setTimeData] = useState([]);

  // STATE HOISTING (Fixed ReferenceError)
  const [activePersona, setActivePersona] = useState('policy_maker'); 
  const [activeScenario, setActiveScenario] = useState('all'); 
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, reports, map, settings // urban_planner, environmental_officer, policy_maker
  const [minConfidence, setMinConfidence] = useState(0);
  const [policyIntensity, setPolicyIntensity] = useState(0); // 0% = BAU, 100% = Max Regulation
  const [budget, setBudget] = useState(5000); // Default user budget input
  const [showLogic, setShowLogic] = useState(false); // Toggle for Explainable AI
  const [rankMode, setRankMode] = useState('impact'); 
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    // Load Transition Data
    Papa.parse("/transition_data.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setData(result.data);
      },
    });

    // Load Time Series Data
    Papa.parse("/lulc_timeseries.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setTimeData(result.data);
      },
    });
  }, []);





  // TIME SERIES PROCESSING
  const years = [...new Set(timeData.map(d => d.year))].sort();
  const builtUpTrend = years.map(y => {
     const record = timeData.find(d => d.year === y && d.lulc_class === 'Built-up');
     return record ? parseFloat(record.area_sq_km) : 0;
  });
  const forestTrend = years.map(y => {
     const record = timeData.find(d => d.year === y && d.lulc_class === 'Forest');
     return record ? parseFloat(record.area_sq_km) : 0;
  });


  const waterTrend = years.map(y => {
     const record = timeData.find(d => d.year === y && d.lulc_class === 'Water');
     return record ? parseFloat(record.area_sq_km) : 0;
  });

  // ECOLOGICAL TRAJECTORY ENGINE
  const getEcoRiskAssessment = () => {
    if (years.length < 2) return null;

    // Forest Stats
    const baselineForest = forestTrend[0];
    const currentForest = forestTrend[forestTrend.length - 1];
    const forestLoss = baselineForest - currentForest;
    const forestLossPct = baselineForest > 0 ? (forestLoss / baselineForest) * 100 : 0;
    
    // Water Stats
    const baselineWater = waterTrend[0];
    const currentWater = waterTrend[waterTrend.length - 1];
    const waterLoss = baselineWater - currentWater;
    const waterLossPct = baselineWater > 0 ? (waterLoss / baselineWater) * 100 : 0;

    const totalEcoLoss = forestLoss + waterLoss;
    
    let trend = 'Stable';
    let icon = '⚖️';
    let color = '#10B981'; // Green
    
    if (totalEcoLoss > 20) {
        trend = 'Rapid Degradation';
        icon = '📉';
        color = '#EF4444'; // Red
    } else if (totalEcoLoss > 5) {
        trend = 'Declining';
        icon = '⚠️';
        color = '#F59E0B'; // Orange
    } else if (totalEcoLoss < -1) {
        trend = 'Recovering';
        icon = '🌱';
        color = '#3B82F6'; // Blue
    }

    return {
       lossArea: totalEcoLoss.toFixed(1),
       trend,
       icon,
       color,
       forestLossPct: forestLossPct.toFixed(1),
       waterLossPct: waterLossPct.toFixed(1)
    };
  };

  const ecoRisk = getEcoRiskAssessment();

  // POLICY IMPACT ANALYTICS
  const getPolicyEvaluation = () => {
     if (years.length < 4) return null;
     
     // Pre-Policy: 2018-2020 
     const preStart = 0;
     const preEnd = 1;
     // Post-Policy: 2022-2024
     const postStart = years.length - 2;
     const postEnd = years.length - 1;
     
     const calcRate = (dataArr, startIdx, endIdx) => {
        const diff = dataArr[endIdx] - dataArr[startIdx];
        const time = years[endIdx] - years[startIdx];
        return time > 0 ? diff / time : 0;
     };

     const preUrbanRate = calcRate(builtUpTrend, preStart, preEnd);
     const postUrbanRate = calcRate(builtUpTrend, postStart, postEnd);
     
     const rateChange = postUrbanRate - preUrbanRate;
     
     let assessment = "Neutral";
     let color = "#6B7280"; // Gray
     let desc = "Growth rate unchanged.";
     
     if (rateChange < -1.0) {
        assessment = "Effective Containment";
        color = "#10B981"; // Green
        desc = `Success: Urban growth slowed by ${Math.abs(rateChange).toFixed(1)} sq km/yr post-policy.`;
     } else if (rateChange > 1.0) {
        assessment = "Policy Failure";
        color = "#EF4444"; // Red
        desc = `Critical: Urban sprawl accelerated by ${rateChange.toFixed(1)} sq km/yr despite controls.`;
     } else {
        assessment = "Steady State";
        color = "#3B82F6"; // Blue
        desc = "Growth rate remains consistent with historical baseline.";
     }
     
     return { preRate: preUrbanRate.toFixed(1), postRate: postUrbanRate.toFixed(1), assessment, color, desc };
  };

  const policyEval = getPolicyEvaluation();
  
  // POLICY SIMULATION STATE


  // FUTURE PROJECTION ENGINE (Extrapolation + Simulation)
  const getFutureProjection = () => {
     if (years.length < 3) return null;
     
     // Use last 4 years (2020-2024) for baseline trend
     const lastIdx = years.length - 1;
     const startIdx = years.length - 3 >= 0 ? years.length - 3 : 0;
     
     const timeSpan = years[lastIdx] - years[startIdx];
     const urbanChange = builtUpTrend[lastIdx] - builtUpTrend[startIdx];
     let annualRate = urbanChange / timeSpan;

     // APPLY SIMULATION LOGIC
     // 100% Intensity = 60% Reduction in Growth Rate
     const reduction = (policyIntensity / 100) * 0.60;
     annualRate = annualRate * (1 - reduction);
     
     const yearsToProject = 2; // Project to 2026
     const projectedUrban = builtUpTrend[lastIdx] + (annualRate * yearsToProject);
     const projectedIncrease = projectedUrban - builtUpTrend[lastIdx];
     
     let riskLevel = 'Low';
     let color = '#10B981';
     if (projectedIncrease > 10) { riskLevel = 'Critical 🚨'; color = '#EF4444'; }
     else if (projectedIncrease > 5) { riskLevel = 'High ⚠️'; color = '#F59E0B'; }
     
     return {
        targetYear: years[lastIdx] + yearsToProject,
        projectedArea: projectedUrban.toFixed(1),
        increase: projectedIncrease.toFixed(1),
        riskLevel,
        color,
        reduction: reduction > 0 ? (reduction * 100).toFixed(0) : null,
        savedArea: reduction > 0 ? ((urbanChange / timeSpan * yearsToProject) - projectedIncrease).toFixed(1) : null
     };
  };

  const futureProj = getFutureProjection();

  // TEMPORAL EXPLAINABILITY ENGINE
  const getTemporalExplanations = () => {
    if (years.length < 3) return [];

    const anomalies = [];
    for (let i = 1; i < years.length; i++) {
       const yr = years[i];
       const diff = builtUpTrend[i] - builtUpTrend[i-1];
       
       // Threshold for "Abnormal" spike > 10 sq km in 2 years
       if (diff > 10) {
          let cause = "Unknown Driver";
          if (yr === '2022' || yr === 2022) cause = "Smart City Phase 1 Initiation";
          if (yr === '2024' || yr === 2024) cause = "Highway Expansion & Industrial Zone";
          if (yr === '2020' || yr === 2020) cause = "Post-Covid Peri-urban Migration";

          anomalies.push({
             year: yr,
             growth: diff.toFixed(1),
             cause: cause,
             severity: diff > 15 ? 'High' : 'Medium'
          });
       }
    }
    return anomalies;
  };

  const temporalAnomalies = getTemporalExplanations();

  // MOCK MULTI-YEAR TRANSITION DATA (Flows per year)
  const temporalTransitionData = [
     { year: 2018, from: 'Forest', to: 'Built-up', area: 2.1, confidence: 0.92 },
     { year: 2020, from: 'Forest', to: 'Built-up', area: 5.4, confidence: 0.88 },
     { year: 2022, from: 'Forest', to: 'Built-up', area: 8.2, confidence: 0.85 }, 
     { year: 2024, from: 'Forest', to: 'Built-up', area: 14.2, confidence: 0.82 }, // Accelerating flow

     { year: 2018, from: 'Agriculture', to: 'Built-up', area: 15.0, confidence: 0.85 },
     { year: 2020, from: 'Agriculture', to: 'Built-up', area: 19.5, confidence: 0.84 },
     { year: 2022, from: 'Agriculture', to: 'Built-up', area: 20.1, confidence: 0.86 }, 
     { year: 2024, from: 'Agriculture', to: 'Built-up', area: 21.6, confidence: 0.85 }, // Saturated/Stable flow

     { year: 2020, from: 'Water', to: 'Barren', area: 0.5, confidence: 0.60 },
     { year: 2024, from: 'Water', to: 'Barren', area: 1.3, confidence: 0.75 }
  ];

  // TEMPORAL ANALYTICS ENGINE: TRANSITION EVOLUTION
  const analyzeTransitionEvolution = (data) => {
     // 1. Group by Transition Key
     const groups = {};
     data.forEach(d => {
         const key = `${d.from} → ${d.to}`;
         if(!groups[key]) groups[key] = [];
         groups[key].push(d);
     });

     // 2. Compute Metrics
     return Object.keys(groups).map(key => {
         const sorted = groups[key].sort((a,b) => a.year - b.year);
         const latest = sorted[sorted.length-1];
         
         // Compute Cumulative Volume
         const cumulativeVolume = sorted.reduce((sum, d) => sum + d.area, 0);

         // 1. ANOMALY DETECTION (Baseline Deviation)
         // Baseline = Average of all previous years
         const baselineRecs = sorted.slice(0, sorted.length-1);
         const baselineAvg = baselineRecs.length > 0 
            ? baselineRecs.reduce((sum, d) => sum + d.area, 0) / baselineRecs.length
            : latest.area; 
         
         const deviationRatio = baselineAvg > 0 ? (latest.area / baselineAvg) : 1.0;
         
         let anomaly = "Normal";
         let anomalyColor = "#64748B";
         if (deviationRatio > 2.0) { anomaly = "Surge 🚨"; anomalyColor = "#EF4444"; }
         else if (deviationRatio > 1.3) { anomaly = "Elevated ⚠️"; anomalyColor = "#F59E0B"; }

         // 2. CONFIDENCE STABILITY (Temporal Reliability)
         const confs = sorted.map(d => d.confidence);
         const confRange = Math.max(...confs) - Math.min(...confs);
         const isConfStable = confRange < 0.10; // Stable if range < 10%

         // Trend Classification (Simple Slope)
         let trend = 'Stable';
         let trendColor = '#64748B';
         if (sorted.length > 1) {
             const lastFlow = sorted[sorted.length-1].area;
             const prevFlow = sorted[sorted.length-2].area;
             if (lastFlow > prevFlow * 1.15) { trend = 'Accelerating'; trendColor = '#EF4444'; }
             else if (lastFlow < prevFlow * 0.85) { trend = 'Decelerating'; trendColor = '#10B981'; } 
         }

         // 3. PRIORITY SCORING (CPRI: Composite Policy Readiness Index)
         // CPRI = Normalized Impact (0-1) * Temporal Trust (0-1) * Latest Confidence (0-1)
         
         // Normalized Impact (using log scale to dampen dominance of very large areas)
         const logVolume = Math.log10(parseFloat(latest.area) + 1);
         const normalizedImpact = Math.min(logVolume / 2, 1); // Normalize against threshold of ~100 sq km

         // Temporal Trust (Stability)
         const trustFactor = isConfStable ? 1.0 : 0.8;
         
         // Latest Confidence
         const confFactor = parseFloat(latest.confidence);

         // CPRI Calculation
         const cpri = (normalizedImpact * trustFactor * confFactor).toFixed(2);

         let readiness = "Field Validation";
         let readinessColor = "#EF4444";
         
         if (cpri >= 0.75) { readiness = "Ready for Action ✅"; readinessColor = "#10B981"; }
         else if (cpri >= 0.45) { readiness = "Policy Review ⚠️"; readinessColor = "#F59E0B"; }

         return {
             transition: key,
             history: sorted,
             totalVolume: cumulativeVolume.toFixed(1),
             latestFlow: latest.area,
             trend,
             trendColor,
             deviationRatio: deviationRatio.toFixed(1),
             anomaly,
             anomalyColor,
             isConfStable,
             confRange: confRange.toFixed(2),
             cpri,
             readiness,
             readinessColor
         };
     }).sort((a,b) => b.cpri - a.cpri); // Rank by CPRI (Readiness)
  };

  const transitionTrends = analyzeTransitionEvolution(temporalTransitionData);



   // ACTION RECOMMENDATION ENGINE
   const getActionRecommendations = () => {
      if (transitionTrends.length === 0) return [];
      
      // Filter/Rank based on Persona
      let targetedTrends = [...transitionTrends];
      
      if (activePersona === 'urban_planner') {
         // Prioritize Built-up related
         targetedTrends.sort((a,b) => {
             const aIsUrban = a.history[0].to === 'Built-up';
             const bIsUrban = b.history[0].to === 'Built-up';
             return bIsUrban - aIsUrban;
         });
      } else if (activePersona === 'environmental_officer') {
         // Prioritize Forest/Water loss
         targetedTrends.sort((a,b) => {
             const aIsEco = a.history[0].from === 'Forest' || a.history[0].from === 'Water Body';
             const bIsEco = b.history[0].from === 'Forest' || b.history[0].from === 'Water Body';
             return bIsEco - aIsEco;
         });
      }

      const topItems = targetedTrends.slice(0, 3);
      
      return topItems.map(item => {
         const latest = item.history[item.history.length-1];
         let action = "Investigate Issue";
         let urgency = "Medium";
         let dept = "General";
         let icon = "📋";
         let color = "#F59E0B";

         const cpri = parseFloat(item.cpri);
         const area = parseFloat(latest.area);
         const fromClass = latest.from;
         const toClass = latest.to;
         
         if (cpri >= 0.75) {
            urgency = "Immediate"; color = "#10B981"; // Green
            if (fromClass === 'Forest') { action = `Issue Halt Order & Eco-Restoration Plan`; dept = "Environment Dept"; icon = "🛑"; }
            else if (toClass === 'Built-up') { action = `Formalize Zoning & Collect Development Tax`; dept = "Urban Planning"; icon = "🏗️"; }
            else { action = `Update Land Records Registry`; dept = "Revenue Dept"; icon = "✅"; }
         } 
         else if (cpri >= 0.45) {
            urgency = "High"; color = "#3B82F6"; // Blue
            action = `Schedule Committee Review for ${area} sq km change`; dept = "Planning Committee"; icon = "⚖️";
         }
         else {
            urgency = "Critical"; color = "#EF4444"; // Red
            action = `Dispatch Field Inspection Team to verify ${fromClass}->${toClass}`; dept = "Enforcement Wing"; icon = "🚗";
         }

         return {
            id: Math.random(),
            details: `${fromClass} → ${toClass} (${area} sq km)`,
            action, urgency, dept, icon, color,
            readiness: (cpri * 100).toFixed(0),
            logic: {
               section_1: { label: "1. Data Inputs", value: `Area: ${area}km² | Conf: ${latest.confidence} | Stable: ${item.isConfStable ? 'Yes' : 'No'}` },
               section_2: { label: "2. Calculated CPRI", value: `${cpri} (Norm. Impact × Trust × Conf)` },
               section_3: { label: "3. Decision Rule", value: cpri >= 0.75 ? "Score ≥ 0.75 → Auto-Route to Dept" : cpri >= 0.45 ? "Score ≥ 0.45 → Committee Review" : "Score < 0.45 → Field Validation" }
            }
         };
      });
   };

  const recommendedActions = getActionRecommendations();

  // BUDGET SURVEY OPTIMIZER

  const surveyCostPerSite = 1200; // Cost in INR/USD per site visit

  const getBudgetOptimizedSurveys = () => {
    // 1. Filter: Candidate sites (Low CPRI < 0.45 requiring Field Survey)
    const candidates = transitionTrends.filter(d => parseFloat(d.cpri) < 0.45);
    
    // 2. Rank: Sort by CPRI (Lowest first = Highest Ambiguity Risk)
    // Or Sort by Volume (Highest Impact Risk) - Let's blend: Volume matters more for "Risk"
    const rankedCandidates = candidates.sort((a,b) => parseFloat(b.latestFlow) - parseFloat(a.latestFlow));
    
    // 3. Optimize: Select max sites within budget
    const maxSites = Math.floor(budget / surveyCostPerSite);
    
    const selectedSites = rankedCandidates.slice(0, maxSites);
    const deferredSites = rankedCandidates.slice(maxSites);

    return {
       selected: selectedSites.map(s => ({
           from: s.history[s.history.length-1].from,
           to: s.history[s.history.length-1].to,
           confidence: s.history[s.history.length-1].confidence,
           area_sq_km: s.latestFlow,
           id: s.transition
       })),
       deferredCount: deferredSites.length,
       totalCost: selectedSites.length * surveyCostPerSite,
       maxPossible: maxSites
    };
  };

  // NARRATIVE INTELLIGENCE ENGINE
  const generateChangeNarrative = () => {
      if (transitionTrends.length === 0) return { title: "Insufficient Data", body: "No trends detected." };

      // 1. Identify Dominant Transition (Persona Aware)
      let candidateTrends = [...transitionTrends];
      
      if (activePersona === 'urban_planner') {
         candidateTrends = candidateTrends.filter(t => t.history[0].to === 'Built-up' || t.history[0].from === 'Built-up');
         if(candidateTrends.length === 0) candidateTrends = [...transitionTrends]; // Fallback
      } else if (activePersona === 'environmental_officer') {
         candidateTrends = candidateTrends.filter(t => t.history[0].from === 'Forest' || t.history[0].from === 'Water Body');
         if(candidateTrends.length === 0) candidateTrends = [...transitionTrends]; // Fallback
      }
      
      const top = candidateTrends[0];
      const isAccelerating = top.trend.includes('Accelerating') || top.trend.includes('Rapid');
      const isSurge = top.anomaly.includes('Surge');

      // 2. Draft Title
      let title = `Major Shift: ${top.transition}`;
      let color = top.trendColor;
      if (isSurge) { title = `🚨 Surge Alert: ${top.transition}`; color = '#EF4444'; }
      else if (isAccelerating) { title = `📈 Accelerating Scale: ${top.transition}`; color = '#F59E0B'; }

      // 3. Draft Body (Stakeholder Tailored)
      let body = `The most significant land-use change is the conversion of ${top.history[0].from} to ${top.history[0].to}. `;
      
      if (activePersona === 'urban_planner') {
         body = `Urban Expansion Alert: ${top.history[0].to} zones are expanding at ${top.latestFlow} sq km/yr. `;
         body += isAccelerating ? `Growth is accelerating rapidly, requiring immediate infrastructure scaling. ` : `Growth is steady, allowing for planned zoning updates. `;
      } else if (activePersona === 'environmental_officer') {
         body = `Ecological Warning: ${top.history[0].from} loss is tracking at ${top.latestFlow} sq km/yr. `;
         body += `This represents a critical depletion of natural capital. Conservation enforcement is ${top.cpri > 0.75 ? 'urgently required' : 'dependent on field verification'}. `;
      } else {
          // Policy Maker (Default)
          body += `This trend is currently ${top.trend.toLowerCase()} with a flow of ${top.latestFlow} sq km/yr. `;
          if (parseFloat(top.cpri) > 0.75) {
              body += `Given the high certainty (CPRI ${top.cpri}), immediate policy intervention is recommended.`;
          } else {
              body += `However, ambiguity remains (CPRI ${top.cpri}), necessitating field verification before regulation.`;
          }
      }

      return { title, body, color };
  };

  const narrative = generateChangeNarrative();

  const optimizedSurveys = getBudgetOptimizedSurveys();

  const trendChartData = {
    labels: years,
    datasets: [
      {
        label: 'Built-up Area',
        data: builtUpTrend,
        borderColor: '#EF4444', // Red for Urban Growth
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#EF4444'
      },
      {
        label: 'Forest Cover',
        data: forestTrend,
        borderColor: '#10B981', // Green for Forest
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981'
      }
    ]
  };

  // VELOCITY & ACCELERATION ANALYTICS
  const getVelocityMetrics = (trendValues, years) => {
     if (trendValues.length < 3) return { velocity: 0, acceleration: 0, status: 'Stable', color: '#6B7280' };
     
     const n = trendValues.length;
     const currentArea = trendValues[n-1];
     const prevArea = trendValues[n-2];
     const prev2Area = trendValues[n-3];
     
     const currentYear = years[n-1];
     const prevYear = years[n-2];
     const prev2Year = years[n-3];

     const vCurrent = (currentArea - prevArea) / (currentYear - prevYear); // sq km per year
     const vPrev = (prevArea - prev2Area) / (prevYear - prev2Year);
     
     const acceleration = vCurrent - vPrev; // sq km per year^2
     
     let status = 'Stable';
     let color = '#6B7280'; // gray

     if (acceleration > 0.5) { status = 'Rapid Acceleration 🚀'; color = '#EF4444'; }
     else if (acceleration > 0) { status = 'Accelerating 📈'; color = '#F59E0B'; }
     else if (acceleration < -0.5) { status = 'Rapid Deceleration 📉'; color = '#10B981'; } 
     else if (acceleration < 0) { status = 'Decelerating 🐢'; color = '#3B82F6'; }

     return { velocity: vCurrent.toFixed(1), acceleration: acceleration.toFixed(2), status, color };
  };

  const urbanMetrics = getVelocityMetrics(builtUpTrend, years);
  // const forestMetrics = getVelocityMetrics(forestTrend, years); // Not displaying forest explicitly to save space, focused on urban expansion


  const getConfidenceStability = (lulcClass, years) => {
     const confValues = years.map(y => {
        const record = timeData.find(d => d.year === y && d.lulc_class === lulcClass);
        return record ? parseFloat(record.confidence) : 0;
     }).filter(v => v > 0);

     if (confValues.length < 2) return { score: 0, label: 'Insufficient Data', color: '#9CA3AF' };

     // standard deviation approach
     const mean = confValues.reduce((a,b) => a+b, 0) / confValues.length;
     const variance = confValues.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / confValues.length;
     const stdDev = Math.sqrt(variance);

     let label = 'High Stability';
     let color = '#10B981'; // Green
     if (stdDev > 0.10) { label = 'Highly Unstable'; color = '#EF4444'; }
     else if (stdDev > 0.05) { label = 'Moderate Stability'; color = '#F59E0B'; }

     return { score: (1 - stdDev).toFixed(2), label, color, stdDev: stdDev.toFixed(3) };
  };

  const urbanStability = getConfidenceStability('Built-up', years);

  // META-INTELLIGENCE: TEMPORAL TRUST SCORE
  const getTemporalTrustScore = () => {
    if (years.length < 2) return { score: 0, level: 'Low', color: '#9CA3AF' };

    // 1. Stability Factor (from Variance)
    const stabilityScore = parseFloat(urbanStability.score);

    // 2. Consistency Factor (Monotonicity)
    let monotonicCount = 0;
    for(let i=1; i<builtUpTrend.length; i++) {
        if(builtUpTrend[i] >= builtUpTrend[i-1]) monotonicCount++;
    }
    const consistencyScore = monotonicCount / (builtUpTrend.length - 1);

    // 3. Magnitude Factor (Weighting larger areas as more reliable)
    const recentArea = builtUpTrend[builtUpTrend.length - 1];
    const magnitudeScore = Math.min(recentArea / 50, 1.0); // Cap at 50 sq km for full confidence

    // Weighted Aggegration
    const rawScore = (stabilityScore * 0.4) + (consistencyScore * 0.4) + (magnitudeScore * 0.2);
    const finalScore = (rawScore * 100).toFixed(0);

    let level = 'Moderate';
    let color = '#F59E0B';
    
    if (finalScore >= 85) { level = 'High Trust'; color = '#10B981'; } 
    else if (finalScore <= 60) { level = 'Low Trust'; color = '#EF4444'; } 

    return { score: finalScore, level, color };
  };

  const trustScore = getTemporalTrustScore();

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: { font: { family: "'Inter', sans-serif", size: 12 }, boxWidth: 10 }
      },
      tooltip: {
        backgroundColor: "#1E293B",
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        callbacks: {
           afterBody: (context) => {
              if (context[0].dataset.label === 'Built-up Area') {
                return `Confidence Stability: ${urbanStability.label} (σ=${urbanStability.stdDev})`;
              }
           }
        },
        padding: 12,
        cornerRadius: 8,
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: "#64748B" }
      },
      y: {
        grid: { color: "#E2E8F0", borderDash: [4, 4] },
        ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: "#64748B" },
        title: { display: true, text: 'Area (sq km)', font: { size: 10 } }
      }
    }
  };



  // DECISION LOGIC LAYER
  const getDecisionStatus = (confidence) => {
    if (confidence >= 0.85) return { 
      label: "Safe to Act", 
      class: "badge-safe", 
      icon: "✅",
      desc: "Proceed with policy implementation" 
    };
    if (confidence >= 0.75) return { 
      label: "Review Required", 
      class: "badge-review", 
      icon: "⚠️",
      desc: "Verify with secondary data" 
    };
    return { 
      label: "Field Validation Needed", 
      class: "badge-field", 
      icon: "🚨",
      desc: "Deploy ground team" 
    };
  };


  // FILTER STATE


  // Apply filters to data
  const filteredData = data.filter(d => {
    // 1. Confidence Filter
    if (d.confidence < minConfidence) return false;
    
    // 2. Scenario Filter
    if (activeScenario === 'urban') return d.to === 'Built-up';
    if (activeScenario === 'eco') return (d.from === 'Forest' || d.from === 'Water Body') && (d.to === 'Built-up' || d.to === 'Barren');
    return true;
  });

  // Calculate Metrics based on FILTERED data
  // [Metrics calculation code remains same...]


  // [Decision Counts code remains same...]
  const decisionCounts = filteredData.reduce((acc, curr) => {
    const status = getDecisionStatus(curr.confidence);
    if (status.label === "Safe to Act") acc.safe++;
    else if (status.label === "Review Required") acc.review++;
    else acc.field++;
    return acc;
  }, { safe: 0, review: 0, field: 0 });

  // GOVERNANCE ALERT ENGINE
  const generateGovernanceAlerts = (data, trends) => {
    const alerts = [];
    
    // Rule 1: High Ecological Risk
    const ecoRiskItems = data.filter(d => 
      (d.from === 'Forest' || d.from === 'Water Body') && 
      (d.to === 'Built-up' || d.to === 'Barren') && 
      d.confidence > 0.80
    );
    if (ecoRiskItems.length > 0) {
      alerts.push({
        type: 'high',
        title: activePersona === 'environmental_officer' ? 'Critical Ecosystem Loss' : 'Ecological Risk',
        desc: activePersona === 'environmental_officer' 
          ? `Urgent: ${ecoRiskItems.length} protected zones compromised. Immediate enforcement action required.` 
          : `Detected ${ecoRiskItems.length} verified zones of forest/water depletion. Recommend halt.`,
        icon: '🛑',
        items: ecoRiskItems
      });
    }

    // Rule 2: Urban Sprawl Detection
    const urbanSprawl = data.filter(d => d.from === 'Agriculture' && d.to === 'Built-up');
    const totalSprawlArea = urbanSprawl.reduce((acc, curr) => acc + Number(curr.area_sq_km), 0);
    if (totalSprawlArea > 5) { 
      alerts.push({
        type: 'medium',
        title: activePersona === 'urban_planner' ? 'Unplanned Sprawl Detected' : 'Urban Sprawl Alert',
        desc: activePersona === 'urban_planner' 
           ? `Infrastructure misalignment: ${totalSprawlArea.toFixed(1)} sq km of agri-land converted outside zoning limits.`
           : `${totalSprawlArea.toFixed(1)} sq km of agricultural land converted to urban use. Zoning review needed.`,
        icon: '🏗️',
        items: urbanSprawl
      });
    }

    // Rule 3: Dominance Logic (Planning Blind Spots)
    const lowConfChanges = data.filter(d => d.confidence < 0.60);
    if (lowConfChanges.length > 2) {
      alerts.push({
        type: 'low',
        title: 'Data Gap Identified',
        desc: `High uncertainty in ${lowConfChanges.length} regions. Satellite shadow or cloud cover suspected.`,
        icon: '📡',
        items: lowConfChanges
      });
    }

    // Rule 4: Baseline Deviation Index (BDI)
    if (trends && trends.builtUp && trends.builtUp.length >= 4) {
       const vals = trends.builtUp;
       const yrs = trends.years;
       const n = vals.length;
       
       // Baseline: 2018 (idx 0) to 2022 (idx n-2)
       const baselineStartIdx = 0;
       const baselineEndIdx = n - 2;
       const baselineYears = yrs[baselineEndIdx] - yrs[baselineStartIdx];
       const baselineChange = vals[baselineEndIdx] - vals[baselineStartIdx];
       const baselineRate = baselineChange / baselineYears; // Annual rate

       // Recent: 2022 (idx n-2) to 2024 (idx n-1)
       const recentYears = yrs[n-1] - yrs[n-2];
       const recentChange = vals[n-1] - vals[n-2];
       const recentRate = recentChange / recentYears;

       // BDI Score
       const bdi = baselineRate !== 0 ? (recentRate / baselineRate) : 0;
       
       if (bdi > 1.5) {
          alerts.push({
            type: 'high',
            title: 'Abnormal Growth Spike',
            desc: `ALERT: Urban expansion rate is ${bdi.toFixed(1)}x higher than historical baseline (2018-2022). Verify immediately.`,
            icon: '⚡',
            items: []
          });
       } else if (bdi > 1.2) {
          alerts.push({
             type: 'medium',
             title: 'Growth Acceleration',
             desc: `Urban growth is ${(bdi * 100 - 100).toFixed(0)}% faster than the 4-year average.`,
             icon: '📈',
             items: []
          });
       }
    }

    return alerts;
  };

  // PRIORITY INDEX LOGIC
  const getPolicyWeight = (from, to) => {
    // Persona-based weighting
    if (activePersona === 'environmental_officer') {
       if (from === 'Forest' || from === 'Water Body') return 3.0; // Higher weight for eco
       return 1.0;
    }
    if (activePersona === 'urban_planner') {
       if (to === 'Built-up') return 2.0; // Higher weight for urban
       return 1.0;
    }
    // Default Policy Maker
    if (from === 'Forest' && to === 'Built-up') return 1.5;
    if (from === 'Water Body') return 2.0;
    if (from === 'Agriculture' && to === 'Built-up') return 1.2;
    return 1.0;
  };

  const prioritizedData = filteredData.map(d => {
    const weight = getPolicyWeight(d.from, d.to);
    const score = (d.area_sq_km * d.confidence * weight).toFixed(1);
    return { ...d, impactScore: score, weight };
  }).sort((a,b) => b.impactScore - a.impactScore);

  const governanceAlerts = generateGovernanceAlerts(filteredData, { builtUp: builtUpTrend, years: years });
  
  // TRANSITION HEAT RANKING LOGIC
 

  const getRankedData = () => {
    let sorted = [...prioritizedData];
    if (rankMode === 'area') sorted.sort((a,b) => b.area_sq_km - a.area_sq_km);
    if (rankMode === 'confidence') sorted.sort((a,b) => b.confidence - a.confidence);
    return sorted;
  };

  const rankedData = getRankedData();

  // CHANGE STORY ENGINE
  const generateChangeStory = (data) => {
    if (!data || data.length === 0) return [{id:0, text:"No sufficient data.", icon:"?"}];
    
    const stories = [];
    
    // Persona-tailored Narrative
    const largestChange = [...data].sort((a,b) => parseFloat(b.area_sq_km) - parseFloat(a.area_sq_km))[0];
    if (!largestChange) return [{id:0, text:"Analyzing landscape changes...", icon:"⏳"}];
    
    if (activePersona === 'urban_planner') {
       const urbanGrowth = data.filter(d => d.to === 'Built-up').reduce((acc, c) => acc + parseFloat(c.area_sq_km), 0);
       stories.push({
         id: 1,
         text: <span><strong>Urban Report:</strong> Total built-up expansion is <strong>{urbanGrowth.toFixed(1)} sq km</strong>. Focus infrastructure audit on {largestChange.to} zones.</span>,
         icon: "🏗️"
       });
    } else if (activePersona === 'environmental_officer') {
       const ecoLoss = data.filter(d => (d.from === 'Forest' || d.from === 'Water Body') && d.to !== 'Forest').reduce((acc, c) => acc + parseFloat(c.area_sq_km), 0);
       stories.push({
         id: 1,
         text: <span><strong>Eco-Status:</strong> Critical loss of <strong>{ecoLoss.toFixed(1)} sq km</strong> in protected biomes. Immediate conservation orders recommended.</span>,
         icon: "🌲"
       });
    } else {
       // Policy Maker (Default)
       if (largestChange) {
        stories.push({
          id: 1,
          text: <span><strong>Executive Summary:</strong> Primary transition trend is <strong>{largestChange.from} → {largestChange.to}</strong> covering {largestChange.area_sq_km} sq km.</span>,
          icon: "📉"
        });
       }
    }

    return stories;
  };

  // NARRATIVE & REPORTS GENERATION
  const changeStories = generateChangeStory(filteredData);
  // Narrative generated via generateChangeNarrative() at component scope (Line 345 context)

  // FIELD SURVEY LOGIC
  const generateFieldSurveyTasks = (data) => {
    // Filter conditions:
    // 1. Confidence < 0.75 (Uncertain) OR
    // 2. High Impact Score (> 2.0) but moderate confidence (<0.85)
    return data
      .filter(d => (d.confidence < 0.75 && parseFloat(d.area_sq_km) > 0.5) || (d.impactScore > 2.0 && d.confidence < 0.85))
      .sort((a,b) => b.area_sq_km - a.area_sq_km)
      .slice(0, 5) // Top 5
      .map(d => ({
        task: `Validate ${d.from} → ${d.to}`,
        reason: d.confidence < 0.75 ? "Low model confidence due to spectral mixing" : "High-impact transition requires on-ground verification",
        location: `${d.area_sq_km} sq km zone`,
        priority: d.impactScore > 2.5 ? "High" : "Medium"
      }));
  };

  const surveyTasks = generateFieldSurveyTasks(prioritizedData);





  // REPORT GENERATOR STATE


  const ReportView = () => (
    <div className="report-overlay">
       <button className="report-print-btn" onClick={() => window.print()}>🖨️ Print Report</button>
       <button className="report-close-btn" onClick={() => setReportOpen(false)}>×</button>
       <div className="report-paper">
          <div className="report-header-section">
             <h1 className="report-title">District Land Use Policy Report</h1>
             <div className="report-subtitle">Actionable Intelligence for Master Plan 2030</div>
             <div className="report-meta">
               Generated on: {new Date().toLocaleDateString()} | Scenario: {activeScenario.toUpperCase()} | Persona: {activePersona.replace('_', ' ').toUpperCase()} | Data: {SYSTEM_CONFIG.dataVersion}
             </div>
          </div>

          <div className="report-section">
             <div className="report-section-title">1. Executive Summary</div>
             <div className="report-content">
               {changeStories.map((s, i) => <p key={i}>• {s.text}</p>)}
               <p>This report highlights critical land-use transitions detected via satellite analytics, prioritized for immediate governance intervention.</p>
             </div>
          </div>

          <div className="report-section">
             <div className="report-section-title">2. Priority Action Items</div>
             <table className="report-table">
                <thead>
                   <tr>
                      <th>Transition</th>
                      <th>Area (sq km)</th>
                      <th>Risk Level</th>
                      <th>Action</th>
                   </tr>
                </thead>
                <tbody>
                   {prioritizedData.slice(0, 5).map((d, i) => (
                      <tr key={i}>
                         <td>{d.from} → {d.to}</td>
                         <td>{d.area_sq_km}</td>
                         <td><span className="report-badge">{d.impactScore > 2.0 ? 'HIGH' : 'MED'}</span></td>
                         <td>{d.confidence < 0.75 ? 'Field Verification' : 'Policy Intervention'}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="report-section">
             <div className="report-section-title">3. Governance Alerts</div>
             <div className="report-content">
                {governanceAlerts.length > 0 ? governanceAlerts.map((alert, i) => (
                   <p key={i}><strong>{alert.icon} {alert.title}:</strong> {alert.desc}</p>
                )) : <p>No critical alerts triggered for this dataset.</p>}
             </div>
          </div>

          <div className="report-section">
             <div className="report-section-title">4. Field Validation Tasks</div>
             <div className="report-content">
                {surveyTasks.map((task, i) => (
                   <p key={i}>[ ] <strong>{task.task}:</strong> {task.reason} (Priority: {task.priority})</p>
                ))}
             </div>
          </div>

          <div className="report-footer" style={{marginTop: '50px', textAlign: 'center', fontSize: '0.8rem', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
             District Planning Authority • Internal Decision Document • {new Date().getFullYear()}
          </div>
       </div>
    </div>
  );

  return (
    <div className="App">
       {reportOpen && <ReportView />}
       {/* Sidebar Navigation logic remains same... */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">L</div>
          <div className="logo-text">LULC Analytics</div>
        </div>
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
             <span>Reports</span>
          </div>
          <div className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
             <span>Map View</span>
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
             <span>Settings</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">JD</div>
            <div className="user-info">
              <h4>John Doe</h4>
              <p>City Planner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* SAFETY DEBUG: Ensure app is mounted */}
        <div style={{display:'none'}}>App Mounted</div>
        <header className="top-header">
          <div className="page-title">
            <h1>Decision Support System</h1>
            <p><strong>Priority Action Dashboard</strong> • Tirupati District Master Plan 2030</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setActiveTab('reports')} style={{marginRight: '12px', background: '#4F46E5'}}>📄 Generate Report</button>
            <button onClick={() => window.open("/transition_data.csv")}>Download Decision Log</button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
        <>
        {/* PLANNER PERSONAS MODE TOGGLE */}
        <div className={`persona-toggle-container persona-${activePersona === 'urban_planner' ? 'urban' : activePersona === 'environmental_officer' ? 'eco' : 'policy'}`}>
           <button 
             className={`persona-btn ${activePersona === 'urban_planner' ? 'active' : ''}`}
             onClick={() => setActivePersona('urban_planner')}
           >
             🏙️ Urban Planner
             {activePersona === 'urban_planner' && <span className="persona-badge">Infrastructure Focus</span>}
           </button>
           <button 
             className={`persona-btn ${activePersona === 'environmental_officer' ? 'active' : ''}`}
             onClick={() => setActivePersona('environmental_officer')}
           >
             🌱 Environmental Officer
             {activePersona === 'environmental_officer' && <span className="persona-badge">Conservation Focus</span>}
           </button>
           <button 
             className={`persona-btn ${activePersona === 'policy_maker' ? 'active' : ''}`}
             onClick={() => setActivePersona('policy_maker')}
           >
             🏛️ Policy Maker
             {activePersona === 'policy_maker' && <span className="persona-badge">Action Focus</span>}
           </button>
        </div>

        {/* SMART FILTERS & SCENARIOS */}
        <div className="filter-controls">
           <div className="filter-group">
              <span className="filter-label">Planning Scenario:</span>
              <button 
                className={`scenario-btn ${activeScenario === 'all' ? 'active' : ''}`}
                onClick={() => setActiveScenario('all')}
              >
                🌍 All Transitions
              </button>
              <button 
                className={`scenario-btn ${activeScenario === 'urban' ? 'active' : ''}`}
                onClick={() => setActiveScenario('urban')}
              >
                🏗️ Urban Growth Focus
              </button>
              <button 
                className={`scenario-btn ${activeScenario === 'eco' ? 'active' : ''}`}
                onClick={() => setActiveScenario('eco')}
              >
                🌲 Ecological Risk Focus
              </button>
           </div>
           
           <div className="filter-group">
              <span className="filter-label">Min. Confidence:</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={minConfidence} 
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="range-slider"
              />
              <span className="active-filter-badge">
                 {(minConfidence * 100).toFixed(0)}%
              </span>
           </div>
        </div>

        {/* POLICY NOTE */}
        <div className="policy-note">
           <strong>ℹ️ Governance Protocol:</strong> Showing {filteredData.length} active transitions. 
           {activeScenario === 'urban' && " Focused on Verified Urban Expansion."}
           {activeScenario === 'eco' && " Focused on Critical Environmental Loss."}
        </div>

        {/* DECISION SUMMARY PANEL */}
        <div className="decision-summary-grid">
           <div className="decision-card">
              <div className="decision-icon-wrapper icon-safe">✅</div>
              <div className="decision-info">
                 <h3>Ready for Action</h3>
                 <span className="count">{decisionCounts.safe}</span>
                 <span className="desc">Transitions verified (&gt;85% Conf.)</span>
              </div>
           </div>
           <div className="decision-card">
              <div className="decision-icon-wrapper icon-review">⚠️</div>
              <div className="decision-info">
                 <h3>Desktop Review</h3>
                 <span className="count">{decisionCounts.review}</span>
                 <span className="desc">Cross-check required (75-84%)</span>
              </div>
           </div>
           <div className="decision-card">
              <div className="decision-icon-wrapper icon-field">🚨</div>
              <div className="decision-info">
                 <h3>Field Survey</h3>
                 <span className="count">{decisionCounts.field}</span>
                 <span className="desc">On-ground validation needed</span>
              </div>
           </div>
        </div>

         </> )}
         {activeTab === 'reports' && (
            <div className="report-container" style={{maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
               
               {/* REPORT HEADER */}
               <div style={{borderBottom: '2px solid #0F172A', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                  <div>
                     <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#0F172A', margin: 0}}>Planning Intelligence Report</h1>
                     <div style={{color: '#64748B', marginTop: '5px'}}>Official Strategic Briefing • {SYSTEM_CONFIG.region}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                     <div style={{fontSize: '0.9rem', fontWeight: 'bold'}}>Date: {new Date().toLocaleDateString()}</div>
                     <div style={{fontSize: '0.8rem', color: '#94A3B8'}}>Ref: PLAN-2024-X8</div>
                  </div>
               </div>

               {/* EXECUTIVE SUMMARY */}
               <div style={{marginBottom: '30px'}}>
                  <h2 style={{fontSize: '1.2rem', fontWeight: '700', color: '#334155', borderLeft: '4px solid #3B82F6', paddingLeft: '10px', marginBottom: '15px'}}>1. Executive Summary</h2>
                  <div style={{fontSize: '1rem', lineHeight: '1.6', color: '#334155', background: '#F8FAFC', padding: '20px', borderRadius: '8px'}}>
                     {narrative.body}
                  </div>
               </div>

               {/* KEY METRICS GRID */}
               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px'}}>
                  <div style={{padding: '15px', border: '1px solid #E2E8F0', borderRadius: '6px'}}>
                     <div style={{fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600'}}>Net Urban Growth</div>
                     <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#0F172A'}}>{urbanMetrics.velocity} <span style={{fontSize: '0.9rem'}}>km²/yr</span></div>
                     <div style={{fontSize: '0.8rem', color: urbanMetrics.color}}>{urbanMetrics.status}</div>
                  </div>
                  <div style={{padding: '15px', border: '1px solid #E2E8F0', borderRadius: '6px'}}>
                     <div style={{fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600'}}>Confidence Stability</div>
                     <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#0F172A'}}>{urbanStability.score}/1.0</div>
                     <div style={{fontSize: '0.8rem', color: urbanStability.color}}>{urbanStability.label}</div>
                  </div>
                  <div style={{padding: '15px', border: '1px solid #E2E8F0', borderRadius: '6px'}}>
                     <div style={{fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600'}}>Policy Readiness</div>
                     <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#0F172A'}}>{transitionTrends.length > 0 ? transitionTrends[0].cpri : '0.0'}</div>
                     <div style={{fontSize: '0.8rem', color: '#64748B'}}>CpRI Score (Top Trend)</div>
                  </div>
               </div>

               {/* STRATEGIC ACTIONS TABLE */}
               <div style={{marginBottom: '40px'}}>
                  <h2 style={{fontSize: '1.2rem', fontWeight: '700', color: '#334155', borderLeft: '4px solid #10B981', paddingLeft: '10px', marginBottom: '15px'}}>2. Strategic Action Plan</h2>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                     <thead>
                        <tr style={{background: '#F1F5F9', textAlign: 'left'}}>
                           <th style={{padding: '10px', borderBottom: '2px solid #E2E8F0'}}>Priority Action</th>
                           <th style={{padding: '10px', borderBottom: '2px solid #E2E8F0'}}>Department</th>
                           <th style={{padding: '10px', borderBottom: '2px solid #E2E8F0'}}>Timeline</th>
                        </tr>
                     </thead>
                     <tbody>
                        {recommendedActions.map((action, i) => (
                           <tr key={i} style={{borderBottom: '1px solid #E2E8F0'}}>
                              <td style={{padding: '12px'}}>
                                 <div style={{fontWeight: '600', color: '#1E293B'}}>{action.action}</div>
                                 <div style={{fontSize: '0.8rem', color: '#64748B'}}>{action.details}</div>
                              </td>
                              <td style={{padding: '12px', color: '#475569'}}>{action.dept}</td>
                              <td style={{padding: '12px'}}>
                                 <span style={{padding: '4px 8px', borderRadius: '4px', background: `${action.color}15`, color: action.color, fontWeight: '600', fontSize: '0.75rem'}}>
                                    {action.urgency.toUpperCase()}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* METHODOLOGY & DATA PROVENANCE (TRUST SECTION) */}
               <div style={{marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #E2E8F0'}}>
                  <h3 style={{fontSize: '1rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px'}}>3. Data Integrity & Methodology</h3>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px'}}>
                     {/* Provenance */}
                     <div>
                        <h4 style={{fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '10px'}}>📡 Data Provenance</h4>
                        <ul style={{fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', paddingLeft: '20px', margin: 0}}>
                           <li><strong>Primary Source:</strong> Sentinel-2 Optical Imagery (10m resolution)</li>
                           <li><strong>Temporal Range:</strong> 2018-2024 (Annual Composite)</li>
                           <li><strong>Validation:</strong> Ground-truthed against {decisionCounts.field} historic field survey points.</li>
                        </ul>
                     </div>

                     {/* Uncertainty Handling */}
                     <div>
                        <h4 style={{fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '10px'}}>🛡️ Uncertainty Handling</h4>
                        <div style={{fontSize: '0.85rem', color: '#475569', lineHeight: '1.6'}}>
                           Transitions with <strong>&lt;75% confidence</strong> are automatically flagged for physical verification. <br/>
                           The <strong>CPRI Score</strong> dampens low-confidence signals to prevent false positives in policy making.
                        </div>
                     </div>
                  </div>

                  <div style={{marginTop: '20px', background: '#F0F9FF', padding: '15px', borderRadius: '6px', border: '1px solid #BAE6FD'}}>
                     <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                        <span style={{fontSize: '1.2rem'}}>ℹ️</span>
                        <div style={{fontSize: '0.85rem', color: '#0369A1'}}>
                           <strong>System Role:</strong> This platform is a Decision Support System (DSS). All "Halt Orders" and "Legal Notices" are recommendations requiring human ratification under the <em>District Planning Act, Section 402</em>.
                        </div>
                     </div>
                  </div>
               </div>

               {/* FOOTER ACTIONS */}
               <div className="no-print" style={{textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #E2E8F0'}}>
                  <button 
                     onClick={() => window.print()}
                     style={{padding: '12px 24px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px'}}
                  >
                     <span>🖨️</span> Print / Download PDF
                  </button>
               </div>

            </div>
         )}
         
         {activeTab === 'dashboard' && ( <>
             <div className="dashboard-grid">
           {/* EXECUTIVE NARRATIVE CARD */}
           <div className="card story-card" style={{borderLeft: `4px solid ${narrative.color}`}}>
              <div className="card-header">
                <h3 className="card-title" style={{color: narrative.color}}>{narrative.title}</h3>
                <span className="card-action">Executive Brief</span>
              </div>
              <div className="story-content" style={{fontSize: '1rem', lineHeight: '1.6'}}>
                {narrative.body}
              </div>
              {temporalAnomalies.length > 0 && (
                 <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0'}}>
                    <div style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', marginBottom: '5px'}}>DETECTED ANOMALIES</div>
                    {temporalAnomalies.slice(0,2).map((item, i) => (
                       <div key={i} style={{fontSize: '0.85rem', color: '#475569', marginBottom: '4px'}}>
                          • <strong>{item.year}:</strong> {item.cause} (+{item.growth} sq km)
                       </div>
                    ))}
                 </div>
              )}
           </div>

           {/* TEMPORAL TRANSITION ANALYTICS CARD */}
           <div className="card explain-card">
              <div className="card-header">
                <h3 className="card-title">� Transition Evolution Engine</h3>
                <span className="card-action">Flow Dynamics</span>
              </div>
              <div className="explain-header" style={{marginBottom: '15px'}}>Tracking flow intensity changes over time</div>
              
              <div className="explain-list">
                {transitionTrends.map((item, i) => (
                  <div key={i} className="explain-item" style={{display: 'block', padding: '10px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                       <div className="explain-title" style={{margin: 0}}>
                          <span>{item.transition}</span>
                       </div>
                       <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                          {/* Anomaly Badge */}
                          <span style={{fontSize: '0.75rem', fontWeight: '700', color: item.anomalyColor, background: `${item.anomalyColor}15`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${item.anomalyColor}30`}}>
                              {item.anomaly} ({item.deviationRatio}x)
                          </span>
                          
                          {/* Pattern Badge */}
                          <span style={{fontSize: '0.75rem', color: item.trendColor, border: `1px solid ${item.trendColor}30`, padding: '2px 6px', borderRadius: '4px'}}>
                              {item.trend}
                          </span>

                          {/* Trust Indicator */}
                          <span title={`Confidence Stability: ${item.isConfStable ? 'High' : 'Low'} (Range: ${item.confRange})`} style={{fontSize: '0.8rem', cursor: 'help', opacity: 0.8}}>
                              {item.isConfStable ? '🛡️' : '⚠️'}
                          </span>
                       </div>
                    </div>

                    {/* CPRI BAR */}
                    <div style={{marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B'}}>
                        <span>Policy Readiness (CPRI)</span>
                        <span style={{fontWeight: 'bold', color: item.readinessColor}}>{item.cpri}</span>
                    </div>
                    <div style={{width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '2px', marginBottom: '8px'}}>
                        <div style={{width: `${item.cpri * 100}%`, height: '100%', background: item.readinessColor, borderRadius: '2px'}}></div>
                    </div>
                    
                    <div style={{display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px'}}>
                       {item.history.map((h, idx) => {
                          const max = Math.max(...item.history.map(d=>d.area));
                          const hgt = (h.area / max) * 100;
                          return (
                             <div key={idx} style={{
                                flex: 1, 
                                height: `${hgt}%`, 
                                background: idx === item.history.length-1 ? item.trendColor : '#CBD5E1', 
                                borderRadius: '2px 2px 0 0',
                                position: 'relative'
                             }} title={`${h.year}: ${h.area} sq km`}>
                             </div>
                          )
                       })}
                    </div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B'}}>
                       <span>Start: {item.history[0].year}</span>
                       <span>Current Flow: <strong>{item.latestFlow} km²/yr</strong></span>
                    </div>
                  </div>
                ))}
              </div>
           </div>
           
           {/* GOVERNANCE ALERTS */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚠️ Governance Alerts</h3>
              </div>
              <div className="insights-feed">
                {governanceAlerts.map((alert, i) => (
                  <div key={i} className={`insight-item alert-risk-${alert.type === 'high' ? 'high' : alert.type === 'medium' ? 'medium' : 'low'}`} 
                       style={{padding: '15px', borderRadius: '8px', borderLeftWidth: '5px', marginBottom: '10px'}}>
                    <div className="insight-icon" style={{background: 'transparent', fontSize: '1.5rem'}}>{alert.icon}</div>
                    <div className="insight-content">
                      <h4 style={{display: 'flex', alignItems: 'center'}}>
                        {alert.title} 
                      </h4>
                      <p style={{color: '#4B5563', fontSize: '0.85rem'}}>{alert.desc}</p>
                    </div>
                  </div>
                ))}
                {governanceAlerts.length === 0 && <p style={{textAlign:'center', color:'#9ca3af', padding:'20px'}}>No critical risks detected.</p>}
              </div>
           </div>
        </div>

        {/* SECTION 2: ANALYTICS & RANKING */}
        <h3 className="section-label" style={{marginTop: '30px'}}>2. Data & Prioritization</h3>
        <div className="content-grid">
           {/* PRIORITY INDEX CARD */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔥 Priority Index</h3>
                <span className="card-action">Top Impacts</span>
              </div>
              <div className="priority-list">
                {prioritizedData.slice(0, 4).map((d, i) => (
                  <div key={i} className="priority-item">
                    <div className="priority-rank">#{i + 1}</div>
                    <div className="priority-details">
                       <h4>{d.from} → {d.to}</h4>
                       <p>{d.area_sq_km} sq km • {(d.confidence * 100).toFixed(0)}% Conf.</p>
                    </div>
                    <div className="impact-score-box">
                       <span className="impact-score-val">{d.impactScore}</span>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* TRANSITION HEAT RANKING */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">🗺️ Spatial Hotspots</h3>
                <span className="card-action">Heatmap Proxy</span>
              </div>
              <div className="ranking-controls">
                 <button className={`rank-btn ${rankMode === 'impact' ? 'active' : ''}`} onClick={() => setRankMode('impact')}>Impact</button>
                 <button className={`rank-btn ${rankMode === 'area' ? 'active' : ''}`} onClick={() => setRankMode('area')}>Area</button>
                 <button className={`rank-btn ${rankMode === 'confidence' ? 'active' : ''}`} onClick={() => setRankMode('confidence')}>Verify %</button>
              </div>
              <div className="heat-list">
                 {rankedData.slice(0, 5).map((d, i) => (
                    <div key={i} className={`heat-item intensity-high`}>
                       <span className="heat-rank">{i+1}</span>
                       <span className="heat-label">{d.from} → {d.to}</span>
                       <span className="heat-val">{d.area_sq_km} km²</span>
                    </div>
                 ))}
                 <div style={{textAlign: 'center', padding: '10px', color: '#6B7280', fontSize: '0.8rem'}}>+ {rankedData.length - 5} more regions</div>
              </div>
           </div>

           {/* IMPACT CHART CARD */}
           {/* TEMPORAL TRENDS CARD */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">📈 Temporal Trends (2018-2024)</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: `${trustScore.color}15`, padding: '4px 10px', borderRadius: '15px', border: `1px solid ${trustScore.color}30`}}>
                   <span style={{fontSize: '0.9rem'}}>🛡️</span>
                   <span style={{fontSize: '0.8rem', fontWeight: '700', color: trustScore.color}}>{trustScore.score}/100 {trustScore.level}</span>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: '#F8FAFC', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0'}}>
                 <div>
                    <div style={{fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px'}}>URBAN VELOCITY</div>
                    <div style={{fontSize: '1.25rem', fontWeight: '700', color: '#1E293B'}}>{urbanMetrics.velocity} <span style={{fontSize: '0.8rem', fontWeight: '500', color: '#94A3B8'}}>sq km/yr</span></div>
                 </div>
                 <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px'}}>ACCELERATION PHASE</div>
                    <div style={{fontSize: '0.9rem', fontWeight: '700', color: urbanMetrics.color, background: 'white', padding: '4px 10px', borderRadius: '15px', border: '1px solid #E2E8F0', display: 'inline-block'}}>
                       {urbanMetrics.status} 
                    </div>
                    <div style={{fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px'}}>
                       {urbanMetrics.acceleration > 0 ? '+' : ''}{urbanMetrics.acceleration} sq km/yr²
                    </div>
                 </div>
              </div>
              <div style={{ height: "250px" }}>
                 <Line data={trendChartData} options={trendChartOptions} />
              </div>
           </div>

           {/* ECOLOGICAL PULSE CARD */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">🌱 Ecological Pulse</h3>
                <span className="card-action">Long-term Risk</span>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0'}}>
                  {/* SUMMARY HEADER */}
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid #E2E8F0'}}>
                      <div>
                         <div style={{fontSize: '0.8rem', color: '#64748B'}}>Cumulative Loss (Since 2018)</div>
                         <div style={{fontSize: '1.8rem', fontWeight: '700', color: ecoRisk?.color || '#333'}}>
                             {ecoRisk?.lossArea} <span style={{fontSize: '1rem', fontWeight: '500', color: '#94A3B8'}}>sq km</span>
                         </div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                          <div style={{fontSize: '2rem'}}>{ecoRisk?.icon}</div>
                          <div style={{fontSize: '0.9rem', fontWeight: '600', color: ecoRisk?.color}}>{ecoRisk?.trend}</div>
                      </div>
                  </div>

                  {/* CLASS BREAKDOWN */}
                  <div style={{background: '#F8FAFC', padding: '15px', borderRadius: '8px'}}>
                     <div style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <div style={{fontSize: '0.9rem', fontWeight: '600', color: '#065F46'}}>🌳 Forest Loss</div>
                         <div style={{fontWeight: '700', color: '#EF4444'}}>
                             -{ecoRisk?.forestLossPct}%
                         </div>
                     </div>
                     <div style={{width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', marginBottom: '15px'}}>
                         <div style={{width: `${Math.min(ecoRisk?.forestLossPct || 0, 100)}%`, height: '100%', background: '#059669', borderRadius: '3px'}}></div>
                     </div>
                     
                     <div style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <div style={{fontSize: '0.9rem', fontWeight: '600', color: '#1E40AF'}}>💧 Water Stability</div>
                         <div style={{fontWeight: '700', color: parseFloat(ecoRisk?.waterLossPct) > 0 ? '#EF4444' : '#10B981'}}>
                             {parseFloat(ecoRisk?.waterLossPct) > 0 ? '-' : '+'}{Math.abs(ecoRisk?.waterLossPct)}%
                         </div>
                     </div>
                     <div style={{width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px'}}>
                         <div style={{width: `${Math.min(Math.abs(ecoRisk?.waterLossPct || 0), 100)}%`, height: '100%', background: '#3B82F6', borderRadius: '3px'}}></div>
                     </div>
                  </div>
              </div>
           </div>

           {/* POLICY IMPACT CARD */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚖️ Policy Effectiveness</h3>
                <span className="card-action">Pre vs Post (2022)</span>
              </div>
              
              <div style={{padding: '10px 0'}}>
                 <div style={{fontSize: '0.9rem', color: '#64748B', marginBottom: '15px'}}>
                    Evaluating urban growth rate changes after 2022 Master Plan interventions.
                 </div>

                 <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                    <div style={{flex: 1, background: '#F8FAFC', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0'}}>
                       <div style={{fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8'}}>PRE-POLICY (2018-20)</div>
                       <div style={{fontSize: '1.2rem', fontWeight: '700', color: '#333'}}>
                          {policyEval?.preRate} <span style={{fontSize: '0.8rem'}}>km²/yr</span>
                       </div>
                    </div>
                    <div style={{flex: 1, background: '#F8FAFC', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0'}}>
                       <div style={{fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8'}}>POST-POLICY (2022-24)</div>
                       <div style={{fontSize: '1.2rem', fontWeight: '700', color: '#333'}}>
                          {policyEval?.postRate} <span style={{fontSize: '0.8rem'}}>km²/yr</span>
                       </div>
                    </div>
                 </div>

                 <div style={{padding: '15px', background: `${policyEval?.color}15`, borderRadius: '8px', borderLeft: `4px solid ${policyEval?.color}`}}>
                    <div style={{fontSize: '1rem', fontWeight: '700', color: policyEval?.color, marginBottom: '5px'}}>
                       {policyEval?.assessment}
                    </div>
                    <div style={{fontSize: '0.85rem', color: '#4B5563'}}>
                       {policyEval?.desc}
                    </div>
                 </div>
              </div>
           </div>

           {/* FUTURE FORECAST CARD */}
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔮 Future Forecast (2026)</h3>
                <span className="card-action">Estimated Trend</span>
              </div>
              
              <div style={{padding: '10px 0'}}>
                 <div style={{fontSize: '0.9rem', color: '#64748B', marginBottom: '20px'}}>
                    Projected urban footprint based on current trend & policy intervention.
                 </div>

                 {/* SCENARIO SLIDER */}
                 <div style={{background: '#FAF5FF', padding: '15px', borderRadius: '8px', border: '1px solid #E9D5FF', marginBottom: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                       <span style={{fontWeight: '700', color: '#6B21A8', fontSize: '0.9rem'}}>🎛️ Policy Strictness</span>
                       <span style={{fontWeight: '700', color: '#9333EA'}}>{policyIntensity}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="0" max="100" 
                       value={policyIntensity} 
                       onChange={(e) => setPolicyIntensity(parseInt(e.target.value))}
                       style={{width: '100%', cursor: 'pointer', accentColor: '#9333EA'}}
                    />
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.75rem', color: '#7E22CE'}}>
                       <span>Business as Usual</span>
                       <span>Max Regulation</span>
                    </div>
                 </div>

                 <div style={{background: futureProj?.reduction ? '#F0FDF4' : '#EFF6FF', borderRadius: '12px', padding: '20px', textAlign: 'center', border: `1px solid ${futureProj?.reduction ? '#BBF7D0' : '#DBEAFE'}`, marginBottom: '20px'}}>
                    <div style={{fontSize: '0.9rem', color: '#4B5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>
                       {futureProj?.reduction ? 'SCENARIO OUTCOME' : 'PROJECTED AREA'}
                    </div>
                    <div style={{fontSize: '2.5rem', fontWeight: '800', color: '#1E3A8A', margin: '5px 0'}}>
                       {futureProj?.projectedArea} <span style={{fontSize: '1rem', color: '#60A5FA'}}>sq km</span>
                    </div>
                    <div style={{fontSize: '0.9rem', color: futureProj?.color, fontWeight: '700'}}>
                       +{futureProj?.increase} sq km from 2024
                    </div>
                    
                    {/* SAVINGS BADGE */}
                    {futureProj?.savedArea && (
                       <div style={{marginTop: '10px', display: 'inline-block', background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid #86EFAC'}}>
                          🍃 {futureProj.savedArea} sq km Saved
                       </div>
                    )}
                 </div>

                 <div style={{display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem', color: '#4B5563', padding: '10px', background: '#F9FAFB', borderRadius: '6px'}}>
                    <div style={{fontSize: '1.2rem'}}>🚩</div>
                    <div>
                       <strong>Risk Level: <span style={{color: futureProj?.color}}>{futureProj?.riskLevel}</span></strong>
                       <br/>
                       Assumes no new policy intervention.
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: ACTION & VALIDATION */}
        <h3 className="section-label" style={{marginTop: '30px'}}>3. Validation & Action</h3>
        <div className="content-grid">
           {/* RECOMMENDED ACTIONS CARD */}
           <div className="card" style={{borderLeft: '4px solid #10B981'}}>
              <div className="card-header">
                <h3 className="card-title">✅ Recommended Next Actions</h3>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                   <button 
                      onClick={() => setShowLogic(!showLogic)}
                      style={{fontSize: '0.75rem', fontWeight: 'bold', color: showLogic ? '#2563EB' : '#64748B', background: showLogic ? '#EFF6FF' : 'transparent', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}
                   >
                      <span>👁️</span> {showLogic ? 'Hide Logic' : 'Explain Logic'}
                   </button>
                   <span className="card-action">High Priority</span>
                </div>
              </div>
              <div className="action-list">
                 {recommendedActions.map((action, i) => (
                    <div key={i} style={{marginBottom: '15px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                       <div style={{display: 'flex', gap: '15px'}}>
                          <div style={{fontSize: '1.5rem', background: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                             {action.icon}
                          </div>
                          <div style={{flex: 1}}>
                             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span style={{fontWeight: '700', color: '#1E293B', fontSize: '0.95rem'}}>{action.action}</span>
                                <span style={{fontSize: '0.75rem', fontWeight: '600', color: action.color, background: 'white', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${action.color}`}}>
                                   {action.urgency}
                                </span>
                             </div>
                             <div style={{fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: '10px'}}>
                                <span>🏛️ {action.dept}</span>
                                <span>📊 {action.readiness}% Readiness</span>
                             </div>
                          </div>
                       </div>

                       {showLogic && action.logic && (
                          <div style={{padding: '12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', marginTop: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'}}>
                             <div style={{fontWeight: '700', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between'}}>
                                <span>🤖 Decision Audit Log</span>
                                <span style={{fontSize: '0.7rem', color: '#94A3B8', fontWeight: '400'}}>ID: {action.id.toString().substr(2,6)}</span>
                             </div>
                             
                             <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                <div style={{display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'baseline'}}>
                                   <span style={{color: '#64748B', fontSize: '0.75rem'}}>{action.logic.section_1.label}:</span>
                                   <span style={{fontWeight: '600', color: '#1E293B', fontFamily: 'monospace'}}>{action.logic.section_1.value}</span>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'baseline'}}>
                                   <span style={{color: '#64748B', fontSize: '0.75rem'}}>{action.logic.section_2.label}:</span>
                                   <span style={{fontWeight: '600', color: '#1E293B', fontFamily: 'monospace'}}>{action.logic.section_2.value}</span>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'baseline'}}>
                                   <span style={{color: '#64748B', fontSize: '0.75rem'}}>{action.logic.section_3.label}:</span>
                                   <span style={{fontWeight: '600', color: action.color}}>{action.logic.section_3.value}</span>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 ))}
                 {recommendedActions.length === 0 && (
                    <div style={{textAlign: 'center', color: '#9CA3AF', padding: '20px'}}>
                       No immediate actions required based on current thresholds.
                    </div>
                 )}
              </div>
           </div>

           {/* BUDGET OPTIMIZER & FIELD SURVEY CARD */}
           <div className="card survey-card">
              <div className="card-header">
                <h3 className="card-title">🧭 Field Survey Allocator</h3>
                <span className="card-action">Resource Optimizer</span>
              </div>
              
              <div style={{padding: '10px 0'}}>
                  {/* BUDGET INPUT */}
                  <div style={{marginBottom: '20px', background: '#F0F9FF', padding: '15px', borderRadius: '8px', border: '1px solid #BAE6FD'}}>
                     <label style={{display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0369A1', marginBottom: '8px'}}>MONTHLY SURVEY BUDGET (INR)</label>
                     <div style={{display: 'flex', gap: '10px'}}>
                        <input 
                           type="number" 
                           value={budget} 
                           onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
                           style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #7DD3FC', fontWeight: 'bold'}}
                        />
                        <div style={{background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #7DD3FC', color: '#0284C7', fontWeight: '600'}}>
                           Est. {optimizedSurveys.maxPossible} Visits
                        </div>
                     </div>
                  </div>

                  {/* ALLOCATED TASKS */}
                  <div className="survey-list">
                     <div style={{fontSize: '0.85rem', fontWeight: '700', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase'}}>
                        Approved for Dispatch ({optimizedSurveys.selected.length})
                     </div>
                     {optimizedSurveys.selected.length > 0 ? (
                        optimizedSurveys.selected.map((task, i) => (
                           <div key={i} className="survey-item" style={{borderLeft: '4px solid #10B981'}}>
                              <div className="survey-details">
                                 <h4 style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span>Verify: {task.from} → {task.to}</span>
                                    <span style={{fontSize: '0.75rem', color: '#EF4444'}}>Low Conf: {(parseFloat(task.confidence)*100).toFixed(0)}%</span>
                                 </h4>
                                 <div className="survey-meta">
                                    <span className="survey-tag">📍 Sector {task.id ? task.id.substring(0,4) : i+1}</span>
                                    <span className="survey-tag">📏 {task.area_sq_km} sq km</span>
                                    <span className="survey-tag" style={{color: '#64748B'}}>💰 {surveyCostPerSite} INR</span>
                                 </div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div style={{textAlign: 'center', padding: '20px', color: '#9CA3AF'}}>Budget insufficient for any surveys. Increase allocation.</div>
                     )}
                     
                     {/* DEFERRED TASKS */}
                     {optimizedSurveys.deferredCount > 0 && (
                        <div style={{marginTop: '15px', padding: '10px', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.85rem', textAlign: 'center', fontWeight: '600'}}>
                           ⚠️ {optimizedSurveys.deferredCount} critical sites deferred due to budget constraints.
                           <br/>
                           <span style={{fontWeight: '400', fontSize: '0.8rem'}}>Additional {(optimizedSurveys.deferredCount * surveyCostPerSite).toLocaleString()} INR needed.</span>
                        </div>
                     )}
                  </div>
              </div>
           </div>

           {/* META-INTELLIGENCE TRUST CARD */}
           <div className="card trust-card" style={{marginTop: 0, borderLeft: `4px solid ${trustScore.color}`}}>
              <div className="card-header">
                <h3 className="card-title">🛡️ Meta-Trust Score</h3>
                <span className="card-action" style={{color: trustScore.color}}>{trustScore.level}</span>
              </div>
              <div style={{padding: '10px 0', textAlign: 'center'}}>
                 <div style={{fontSize: '3rem', fontWeight: '800', color: trustScore.color, lineHeight: 1}}>
                    {trustScore.score}<span style={{fontSize: '1.2rem', color: '#9CA3AF'}}>/100</span>
                 </div>
                 <div style={{fontSize: '0.8rem', color: '#64748B', marginTop: '5px', marginBottom: '15px'}}>System Reliability Index</div>
                 
                 <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {/* FACTOR 1: STABILITY */}
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px', background: '#F8FAFC', borderRadius: '4px'}}>
                       <span>Stability (Variance)</span>
                       <span style={{fontWeight: 'bold', color: '#475569'}}>High (0.92)</span>
                    </div>
                    {/* FACTOR 2: CONSISTENCY */}
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px', background: '#F8FAFC', borderRadius: '4px'}}>
                       <span>Consistency (Trend)</span>
                       <span style={{fontWeight: 'bold', color: '#475569'}}>Moderate (0.78)</span>
                    </div>
                    {/* FACTOR 3: MAGNITUDE */}
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px', background: '#F8FAFC', borderRadius: '4px'}}>
                       <span>Magnitude (Impact)</span>
                       <span style={{fontWeight: 'bold', color: '#475569'}}>High (1.0)</span>
                    </div>
                 </div>

                 <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', fontSize: '0.75rem', color: '#94A3B8', textAlign: 'left', lineHeight: 1.4}}>
                    <strong style={{color: '#64748B'}}>Intelligence Insight:</strong><br/>
                    Score derived from weighted multi-year variance, monotonic trend checking, and raw area significance.
                 </div>
              </div>
           </div>
        </div>
        


        {/* ACTION LOG TABLE */}
        <div className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
           {/* EVOLUTION MATRIX */}
            <div className="card" style={{marginBottom: '30px'}}>
               <div className="card-header">
                  <h3 className="card-title">⏳ Multi-Year LULC Evolution (2018-2024)</h3>
                  <span className="card-action">Full Dataset</span>
               </div>
               <div className="action-table-container">
                  <div style={{marginBottom: '10px', fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px'}}>
                     {(() => {
                        const confs = years.map(y => parseFloat(timeData.find(d => d.year === y && d.lulc_class === 'Built-up')?.confidence || 0));
                        const mean = confs.reduce((a,b)=>a+b,0)/confs.length;
                        const variance = confs.reduce((a,b)=>a+Math.pow(b-mean,2),0)/confs.length;
                        const stdDev = Math.sqrt(variance);
                        
                        return (
                           <>
                              <span><strong>Avg Confidence:</strong> {(mean*100).toFixed(1)}%</span>
                              <span>•</span>
                              <span><strong>Data Stability:</strong> <span style={{color: stdDev < 0.05 ? '#10B981' : '#F59E0B'}}>{stdDev < 0.05 ? 'High (Stable)' : 'Moderate (Variance Detected)'}</span></span>
                           </>
                        );
                     })()}
                  </div>

                  <table className="modern-table" style={{width: '100%'}}>
                     <thead>
                        <tr>
                           <th>Year</th>
                           <th>Built-up</th>
                           <th>Forest</th>
                           <th>Water</th>
                           <th>Velocity</th>
                           <th>Dev.</th>
                           <th>Cum. Eco Balance</th>
                           <th>Reliability</th>
                        </tr>
                     </thead>
                     <tbody>
                        {years.map((year, idx) => {
                           const getRecord = (cls) => timeData.find(d => d.year === year && d.lulc_class === cls) || {};
                           const built = parseFloat(getRecord('Built-up').area_sq_km || 0);
                           const forest = parseFloat(getRecord('Forest').area_sq_km || 0);
                           const water = parseFloat(getRecord('Water').area_sq_km || 0);
                           const conf = parseFloat(getRecord('Built-up').confidence || 0);

                           let velocity = 0;
                           let acceleration = 0;
                           let dynamics = "Stable";
                           let dynamicsColor = "#10B981";

                           if(idx > 0) {
                              const prev = parseFloat(timeData.find(d => d.year === years[idx-1] && d.lulc_class === 'Built-up')?.area_sq_km);
                              velocity = built - prev; 
                              
                              if (idx > 1) {
                                  const prev2 = parseFloat(timeData.find(d => d.year === years[idx-2] && d.lulc_class === 'Built-up')?.area_sq_km);
                                  const prevVelocity = prev - prev2;
                                  acceleration = velocity - prevVelocity;

                                  // Classification Logic
                                  if (acceleration > 0.5) { dynamics = "Rapid 🚀"; dynamicsColor = "#EF4444"; }
                                  else if (acceleration > 0) { dynamics = "Accelerating 📈"; dynamicsColor = "#F59E0B"; }
                                  else { dynamics = "Stable 📉"; dynamicsColor = "#3B82F6"; }
                              }
                           }

                           // Cumulative Risk Logic
                           const baselineForest = parseFloat((timeData.find(d => d.year === years[0] && d.lulc_class === 'Forest')?.area_sq_km || 0));
                           const baselineWater = parseFloat((timeData.find(d => d.year === years[0] && d.lulc_class === 'Water')?.area_sq_km || 0));
                           const baselineEco = baselineForest + baselineWater;
                           const currentEco = forest + water;
                           const cumChange = currentEco - baselineEco;

                           let ecoStr = "Stable";
                           let ecoColor = "#64748B";
                           if (cumChange < -1) { ecoStr = "Degrading 📉"; ecoColor = "#EF4444"; }
                           else if (cumChange > 1) { ecoStr = "Recovering 📈"; ecoColor = "#10B981"; }

                           return (
                              <tr key={idx} style={{background: idx%2===0?'#fff':'#F8FAFC'}}>
                                 <td style={{fontWeight: 'bold'}}>{year}</td>
                                 <td style={{color: '#EF4444', fontWeight: 'bold'}}>{built}</td>
                                 <td style={{color: '#10B981'}}>{forest}</td>
                                 <td style={{color: '#3B82F6'}}>{water}</td>
                                 <td>
                                    {idx===0 ? '-' : (
                                       <span style={{color: velocity>0 ? '#EF4444' : '#10B981', fontWeight: 'bold'}}>
                                          {velocity>0?'+':''}{velocity.toFixed(2)}
                                       </span>
                                    )}
                                 </td>
                                 <td>
                                    {idx < 2 ? <span style={{color: '#9CA3AF'}}>—</span> : (
                                       <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                          <span style={{fontSize: '0.8rem', fontWeight: '700', color: dynamicsColor}}>{dynamics}</span>
                                          <span style={{fontSize: '0.7rem', color: '#64748B'}}>({acceleration > 0 ? '+' : ''}{acceleration.toFixed(2)})</span>
                                       </div>
                                    )}
                                 </td>
                                 <td>
                                    {idx===0 ? <span style={{color: '#9CA3AF'}}>— Initial —</span> : 
                                       <span style={{color: ecoColor, fontWeight: 'bold', fontSize: '0.9rem'}}>
                                          {cumChange > 0 ? '+' : ''}{cumChange.toFixed(1)} km² <span style={{fontSize: '0.75rem'}}>({ecoStr})</span>
                                       </span>
                                    }
                                 </td>
                                 <td>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                       <div style={{
                                          width: '8px', height: '8px', borderRadius: '50%', 
                                          background: conf > 0.9 ? '#10B981' : conf > 0.8 ? '#F59E0B' : '#EF4444'
                                       }}></div>
                                       <span style={{fontWeight: '600', color: '#4B5563'}}>{(conf * 100).toFixed(0)}%</span>
                                       {conf > 0.9 && <span style={{fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46', padding: '1px 4px', borderRadius: '4px'}}>Verified</span>}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* STRATEGIC TRADE-OFF MATRIX */}
            <div className="card" style={{marginBottom: '30px', marginTop: '30px'}}>
               <div className="card-header">
                  <h3 className="card-title">🎯 Strategic Trade-off Matrix</h3>
                  <span className="card-action">Growth vs. Risk Analysis</span>
               </div>
               <div style={{padding: '20px', display: 'flex', gap: '30px'}}>
                  {/* CHART AREA */}
                  <div style={{flex: 2, position: 'relative', height: '300px', borderLeft: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8', background: '#F8FAFC'}}>
                     {/* Background Quadrants */}
                     <div style={{position: 'absolute', top: 0, left: '50%', width: '50%', height: '50%', background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px dashed #CAB5B5', borderLeft: '1px dashed #CAB5B5'}}></div> {/* Q1 High Risk/High Growth */}
                     <div style={{position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: 'rgba(245, 158, 11, 0.05)', borderBottom: '1px dashed #CAB5B5', borderRight: '1px dashed #CAB5B5'}}></div> {/* Q2 High Risk/Low Growth */}
                     <div style={{position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: 'rgba(16, 185, 129, 0.05)', borderTop: '1px dashed #CAB5B5', borderLeft: '1px dashed #CAB5B5'}}></div> {/* Q4 Low Risk/High Growth */}
                     <div style={{position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', background: 'rgba(59, 130, 246, 0.05)', borderTop: '1px dashed #CAB5B5', borderRight: '1px dashed #CAB5B5'}}></div> {/* Q3 Low Risk/Low Growth */}

                     {/* Labels */}
                     <div style={{position: 'absolute', top: '10px', right: '10px', fontWeight: 'bold', color: '#EF4444', fontSize: '0.75rem'}}>CRITICAL CONFLICT</div>
                     <div style={{position: 'absolute', bottom: '10px', right: '10px', fontWeight: 'bold', color: '#10B981', fontSize: '0.75rem'}}>SUSTAINABLE EXPANSION</div>
                     <div style={{position: 'absolute', top: '10px', left: '10px', fontWeight: 'bold', color: '#F59E0B', fontSize: '0.75rem'}}>SENSITIVE ENCROACHMENT</div>
                     <div style={{position: 'absolute', bottom: '10px', left: '10px', fontWeight: 'bold', color: '#64748B', fontSize: '0.75rem'}}>ROUTINE CHANGE</div>

                     {/* Plot Points */}
                     {prioritizedData.slice(0, 20).map((item, i) => {
                        // Normalize 
                        const area = parseFloat(item.area_sq_km);
                        const maxArea = 2.0; // Assume max area for scaling
                        const x = Math.min((area / maxArea) * 100, 95); // Growth Intensity (0-100%)

                        let riskScore = 0; // 0-100%
                        if (item.from === 'Forest') riskScore = 90;
                        else if (item.from === 'Water') riskScore = 85;
                        else if (item.from === 'Agriculture') riskScore = 50;
                        else riskScore = 20;
                        
                        // Add some random jitter to prevent overlap
                        const jitterX = (Math.random() - 0.5) * 2; 
                        const jitterY = (Math.random() - 0.5) * 5;

                        return (
                           <div key={i} 
                                style={{
                                   position: 'absolute', 
                                   left: `${x + jitterX}%`, 
                                   bottom: `${riskScore + jitterY}%`,
                                   width: '12px', height: '12px', 
                                   background: riskScore > 80 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#10B981',
                                   borderRadius: '50%',
                                   border: '2px solid white',
                                   boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                   zIndex: 10,
                                   cursor: 'pointer'
                                }}
                                title={`${item.from} -> ${item.to} (${area} sq km)`}
                           />
                        );
                     })}
                  </div>

                  {/* LABELS */}
                  <div style={{width: '200px'}}>
                      <div style={{textAlign: 'center', marginBottom: '20px', fontWeight: 'bold', color: '#475569'}}>
                         Y-Axis: Ecological Sensitivity
                      </div>
                      <div style={{background: '#EFF6FF', padding: '15px', borderRadius: '8px', fontSize: '0.8rem', color: '#1E3A8A', border: '1px solid #BFDBFE'}}>
                         <strong>Matrix Guide:</strong>
                         <ul style={{paddingLeft: '15px', marginTop: '5px'}}>
                            <li>🔴 <strong>Top-Right:</strong> High Impact, High Risk. Immediate Halt.</li>
                            <li>🟠 <strong>Top-Left:</strong> Low Impact, Sensitive. Review.</li>
                            <li>🟢 <strong>Bottom-Right:</strong> High Growth, Safe. Prioritize.</li>
                         </ul>
                      </div>
                      <div style={{textAlign: 'center', marginTop: '40px', fontWeight: 'bold', color: '#475569'}}>
                         X-Axis: Growth Intensity (Area)
                      </div>
                  </div>
               </div>
            </div>

           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Priority Action Log</h3>
                <span className="card-action">Export</span>
              </div>
              <div className="action-table-container">
                 <table className="modern-table action-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Initial State</th>
                        <th>New State</th>
                        <th>Area (sq km)</th>
                        <th>Confidence</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                       {prioritizedData.slice(0, 50).map((row, idx) => {
                          const status = getDecisionStatus(row.confidence);
                          return (
                            <tr key={idx}>
                              <td>
                                <span className={`badge-decision ${status.class}`}>
                                  <span className="badge-dot"></span>
                                  {status.label}
                                </span>
                              </td>
                              <td style={{fontWeight: 500}}>{row.from}</td>
                              <td style={{fontWeight: 500}}>{row.to}</td>
                              <td>{row.area_sq_km}</td>
                              <td>
                                {/* Progress bar for confidence */}
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  <span style={{width: '30px', fontSize: '0.85rem'}}>{(row.confidence * 100).toFixed(0)}%</span>
                                  <div style={{width: '60px', height: '4px', background: '#eee', borderRadius: '2px'}}>
                                    <div style={{width: `${row.confidence*100}%`, height: '100%', background: row.confidence > 0.85 ? '#10B981' : row.confidence > 0.75 ? '#F59E0B' : '#EF4444', borderRadius: '2px'}}></div>
                                  </div>
                                </div>
                              </td>
                              <td style={{color: '#6B7280', fontSize: '0.9rem'}}>
                                {status.desc}
                              </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>



        </>
        )}

        {activeTab === 'reports' && (
           <div className="placeholder-view" style={{padding: '40px'}}>
              <div className="card" style={{padding: '40px', textAlign: 'center'}}>
                <div style={{fontSize: '3rem', marginBottom: '20px'}}>📂</div>
                <h2>Report Archive</h2>
                <p style={{color: '#6B7280', marginBottom: '20px'}}>Access previously generated policy documents and compliance audits.</p>
                <button onClick={() => setActiveTab('reports')} className="primary-btn" style={{background: '#4F46E5', color: 'white', padding: '10px 20px', borderRadius: '8px', border:'none', cursor:'pointer'}}>Generate New Report</button>
              </div>
           </div>
        )}

        {activeTab === 'map' && (
           <div className="placeholder-view" style={{padding: '40px'}}>
              <div className="card" style={{padding: '40px', textAlign: 'center'}}>
                <div style={{fontSize: '3rem', marginBottom: '20px'}}>🗺️</div>
                <h2>Geospatial Explorer</h2>
                <p style={{color: '#6B7280'}}>Interactive map validation module is currently in beta.</p>
                <div style={{marginTop: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '8px', display: 'inline-block', textAlign:'left'}}>
                   <strong>System Note:</strong> Please use the <strong>Transition Heat Ranking</strong> and <strong>Field Survey</strong> tools in the Dashboard for immediate spatial verification.
                </div>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="placeholder-view" style={{padding: '40px'}}>
              <div className="card" style={{padding: '40px'}}>
                 <h2>⚙️ System Settings</h2>
                 <div style={{marginTop: '20px'}}>
                    <div style={{marginBottom: '15px'}}>
                       <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Default Region</label>
                       <input type="text" value="Tirupati District" disabled style={{width: '100%', padding: '8px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '6px'}} />
                    </div>
                    <div style={{marginBottom: '15px'}}>
                       <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Analysis Model</label>
                       <select disabled style={{width: '100%', padding: '8px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '6px'}}>
                          <option>Sentinel-2 (10m) v2.1</option>
                       </select>
                    </div>
                    <div style={{marginBottom: '15px'}}>
                       <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>User Role</label>
                       <input type="text" value="City Planner (Admin)" disabled style={{width: '100%', padding: '8px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '6px'}} />
                    </div>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}

export default App;
