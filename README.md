# Smart LULC Analytics Dashboard - Tirupati District 🌍

![Status](https://img.shields.io/badge/Status-Hackathon_Ready-success) ![Tech](https://img.shields.io/badge/Tech-React_|_Chart.js_|_GeoAI-blue)

## 📌 Project Overview

The **Smart LULC (Land Use Land Cover) Analytics Dashboard** is an AI-powered decision support system designed for city planners and governance bodies in Tirupati. It uses satellite imagery data (Sentinel-2) to track, visualize, and analyze land-use transitions over time, providing actionable insights for sustainable urban development.

## 🚀 Key Features

- **Transition Matrix**: Interactive heatmap showing precise area conversions (e.g., Agriculture → Built-up).
- **AI Confidence Scoring**: Reliability metrics for every detected change to guide field verification.
- **Urban Expansion Tracking**: Real-time alerts for critical land-use shifts.
- **SaaS-Grade UI**: Modern, responsive dashboard with a "Command Center" aesthetic.
- **Instant Reporting**: One-click CSV export for downstream analysis.

## 🛠️ Tech Stack

- **Frontend**: React.js, CSS Modules (SaaS & Sci-Fi Themes)
- **Visualization**: Chart.js, React-Chartjs-2
- **Data Handling**: PapaParse (CSV processing)
- **Deployment**: Vercel / Netlify Ready

## 📂 Project Structure

```
/public
  ├── transition_data.csv  # Raw satellite transition data
/src
  ├── App.js               # Main Dashboard Logic & Layout
  ├── App.css              # Styling (Themes: Glassmorphism, Neumorphism)
```

## ⚡ Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ashwin605/LULC-analytics.git
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the dashboard**
   ```bash
   npm start
   ```

## 📸 Demo Highlights

_See `DEMO_GUIDE.md` for a full presentation script._

---

_Built for the Smart City Hackathon 2026._
