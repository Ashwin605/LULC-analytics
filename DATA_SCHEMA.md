# 🏗️ Planning Intelligence System: Data Architecture

To ensure the Planning Intelligence System is scalable, interoperable, and "hackathon-ready" without heavy GIS dependencies, we define a lightweight **Aggregated Transition Model (ATM)**.

This schema avoids complex spatial geometries (GeoJSON/Shapefiles) in favor of pre-computed analytical statistics, enabling instant client-side rendering and decision logic.

---

## 1. Unified Schema Definition

The core data unit is a **LULC Transition Record**.

### Fields

| Field Name   | Type      | Description                                                                                              | Example       |
| :----------- | :-------- | :------------------------------------------------------------------------------------------------------- | :------------ |
| `year`       | `Integer` | The ending year of the analysis period (e.g., 2024 represents change from 2023-2024).                    | `2024`        |
| `from_lulc`  | `String`  | The initial land use class (Source).                                                                     | `"Forest"`    |
| `to_lulc`    | `String`  | The final land use class (Target).                                                                       | `"Built-up"`  |
| `area_sq_km` | `Float`   | The total area of this specific transition in square kilometers.                                         | `14.2`        |
| `confidence` | `Float`   | The probabilistic confidence score (0.0 - 1.0) of this detection, derived from the ML model's certainty. | `0.88`        |
| `region_id`  | `String`  | _(Optional)_ ID for ward/sector-level granularity.                                                       | `"Sector-42"` |

---

## 2. Format Specifications

### Option A: Flat CSV (Recommended for Data Portability)

Best for interoperability with Excel, Pandas, and simple aggregation tools.

```csv
year,from_lulc,to_lulc,area_sq_km,confidence,region_id
2024,Forest,Built-up,14.2,0.88,Sector-12
2024,Agriculture,Built-up,21.6,0.84,Sector-12
2023,Forest,Built-up,10.1,0.92,Sector-12
2023,Water,Barren,1.3,0.90,Sector-08
```

### Option B: JSON (Recommended for Web App State)

Best for direct consumption by React/JavaScript applications.

```json
[
  {
    "year": 2024,
    "transitions": [
      {
        "from": "Forest",
        "to": "Built-up",
        "area_sq_km": 14.2,
        "confidence": 0.88,
        "metadata": { "growth_type": "Sprawl" }
      },
      {
        "from": "Agriculture",
        "to": "Built-up",
        "area_sq_km": 21.6,
        "confidence": 0.84
      }
    ]
  },
  {
    "year": 2023,
    "transitions": [
      {
        "from": "Forest",
        "to": "Built-up",
        "area_sq_km": 10.1,
        "confidence": 0.92
      }
    ]
  }
]
```

---

## 3. Design Principles (Why this wins)

1.  **Zero Latency**: By pre-aggregating area at the "Transition" level, we avoid processing millions of pixels in the browser.
2.  **Temporal Depth**: Identify trends (Velocity/Acceleration) by simply querying `year` variance.
3.  **Explainability**: The `confidence` field allows us to build "Trust Scores" and "Field Survey Allocators" purely from math, without needing the raw satellite image.
4.  **Scalability**: Adding a new year is just appending rows. Adding a new region is just a new column ID.

---

## 4. Implementation Example (JavaScript)

```javascript
// Calculate Urban Velocity (Changes in Built-up Area per Year)
const getVelocity = (data) => {
  const years = [...new Set(data.map((d) => d.year))].sort();

  return years.map((year) => {
    const annualGrowth = data
      .filter((d) => d.year === year && d.to_lulc === "Built-up")
      .reduce((sum, d) => sum + d.area_sq_km, 0);

    return { year, velocity: annualGrowth };
  });
};
```
