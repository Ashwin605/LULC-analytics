import React, { useEffect, useState } from "react";
import "./App.css";
import Papa from "papaparse";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    Papa.parse("/transition_data.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setData(result.data);
      },
    });
  }, []);

  const labels = data.map(
    (d) => `${d.from} → ${d.to}`
  );

  const areaValues = data.map(
    (d) => Number(d.area_sq_km)
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Impact",
        data: areaValues,
        backgroundColor: "#2563EB", // Royal Blue
        borderRadius: 4,
        hoverBackgroundColor: "#1E40AF",
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 14 },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, 
          color: "#6B7280" 
        },
      },
      y: {
        grid: { color: "#E5E7EB", borderDash: [4, 4] },
        ticks: { 
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, 
          color: "#6B7280" 
        },
        border: { display: false },
      },
    },
  };

  // Calculate Summary Metrics
  const totalAreaChanged = data.reduce((acc, curr) => acc + Number(curr.area_sq_km), 0).toFixed(1);
  const avgConfidence = (data.reduce((acc, curr) => acc + Number(curr.confidence), 0) / (data.length || 1)).toFixed(2);
  const builtUpExpansion = data.filter(d => d.to === 'Built-up').reduce((acc, curr) => acc + Number(curr.area_sq_km), 0).toFixed(1);
  const agriLoss = data.filter(d => d.from === 'Agriculture').reduce((acc, curr) => acc + Number(curr.area_sq_km), 0).toFixed(1);

  return (
    <div className="App">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">L</div>
          <div className="logo-text">LULC Analytics</div>
        </div>
        <nav className="nav-links">
          <div className="nav-item active">
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <span>Reports</span>
          </div>
          <div className="nav-item">
            <span>Map View</span>
          </div>
          <div className="nav-item">
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
        <header className="top-header">
          <div className="page-title">
            <h1>Overview</h1>
            <p>Welcome back, here's what's happening in Tirupati District.</p>
          </div>
          <div className="header-actions">
            <button onClick={() => window.open("/transition_data.csv")}>Download Report</button>
          </div>
        </header>

        {/* KPI Cards Row */}
        <div className="kpi-grid">
           <div className="kpi-card">
              <span className="kpi-title">Total Area Changed</span>
              <span className="kpi-value">{totalAreaChanged} <small>sq km</small></span>
              <span className="kpi-trend trend-up">↑ 12% vs last year</span>
           </div>
           <div className="kpi-card">
              <span className="kpi-title">Urban Expansion</span>
              <span className="kpi-value">{builtUpExpansion} <small>sq km</small></span>
              <span className="kpi-trend trend-down">↑ Critical Level</span>
           </div>
           <div className="kpi-card">
              <span className="kpi-title">Agriculture Loss</span>
              <span className="kpi-value">{agriLoss} <small>sq km</small></span>
              <span className="kpi-trend trend-down">↓ Needs Attention</span>
           </div>
           <div className="kpi-card">
              <span className="kpi-title">Model Reliability</span>
              <span className="kpi-value">{(avgConfidence * 100).toFixed(0)}%</span>
              <span className="kpi-trend trend-up">High Confidence</span>
           </div>
        </div>

        {/* Chart & Matrix Section */}
        <div className="content-grid">
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Impact Visualization</h3>
                <span className="card-action">View Details</span>
              </div>
              <div style={{ height: "300px" }}>
                 <Bar data={chartData} options={chartOptions} />
              </div>
           </div>

           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Alerts</h3>
              </div>
              <div className="insights-feed">
                {data.filter(d => d.to === 'Built-up').slice(0,3).map((d, i) => (
                  <div key={i} className="insight-item">
                    <div className="insight-icon">⚠️</div>
                    <div className="insight-content">
                      <h4>Urban Sprawl Detected</h4>
                      <p>{d.from} converted to Built-up ({d.area_sq_km} sq km)</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Transition Matrix</h3>
                <span className="card-action" onClick={() => window.open("/transition_data.csv")}>Export Data</span>
              </div>
              <div className="table-container">
                 <table className="modern-table">
                    <thead>
                      <tr>
                        <th>From \ To</th>
                        {[...new Set(data.map(d => d.to))].sort().map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                       {[...new Set(data.map(d => d.from))].sort().map(row => (
                         <tr key={row}>
                           <td style={{fontWeight: 600, color: '#374151'}}>{row}</td>
                           {[...new Set(data.map(d => d.to))].sort().map(col => {
                              const cell = data.find(d => d.from === row && d.to === col);
                              const val = cell ? Number(cell.area_sq_km) : 0;
                              return (
                                <td key={col}>
                                  {val > 0 ? (
                                    <span className="cell-value" style={{
                                      backgroundColor: val > 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                      color: val > 10 ? '#B91C1C' : '#1D4ED8'
                                    }}>
                                      {val} sq km
                                    </span>
                                  ) : "-"}
                                </td>
                              );
                           })}
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}

export default App;
