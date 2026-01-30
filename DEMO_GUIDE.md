# 3-Minute Hackathon Demo Script

## 1. Problem Context (0:00 - 0:30)

- **Say:** "Good morning. Rapid urbanization in Tirupati is creating a crisis: we are losing forest cover to unplanned construction. City planners currently lack the data to track this in real-time."
- **Show:** The **Problem Context** section of the dashboard.
- **Hook:** "We built a decision support system that doesn't just show _what_ is changing, but _how reliably_ we know it."

## 2. Methodology (0:30 - 1:00)

- **Say:** "Our solution analyzes satellite imagery from Year 1 and Year 2. We use pixel-level change detection to identify transitions."
- **Show:** The **Methodology** cards (Satellite Data, Change Detection).
- **Key Point:** "It's automated, scalable, and provides aggregated metrics for the whole district."

## 3. Results & Matrix (1:00 - 1:45)

- **Say:** "Let's look at the data. Here is our **Transition Matrix**."
- **Show:** The 5x5 Matrix.
- **Action:** Point to a specific cell (e.g., Agriculture -> Built-up).
- **Say:** "You can see exactly how many square kilometers of Agriculture were converted to Built-up areas. This isn't just a guess; it's quantified impact."
- **Show:** The **Visual Transition Overview** (Bar Chart) to show the scale.

## 4. Confidence & Reliability (1:45 - 2:15)

- **Say:** "Crucially, false alarms waste resources. We implemented a **Confidence Score** for every transition."
- **Show:** The **Confidence & Reliability** section.
- **Explain:** "High confidence changes (>0.85) are ready for policy action. Low confidence ones flag where ground teams need to verify. This prioritizes limited government workforce."

## 5. Insights & Impact (2:15 - 3:00)

- **Say:** "Finally, we translate this data into **Actionable Insights**."
- **Show:** The **Key Insights** section.
- **Conclusion:** "We've identified specific zones of ecological risk and urban sprawl. This tool empowers Tirupati Smart City governance to move from reactive fixing to proactive planning."

---

# Jury Q&A Cheat Sheet

**Q: Where did you get the data?**
**A:** "We use open-source satellite imagery (Sentinel-2/Landsat). The transition data shown here is processed from pixel-level classification comparisons between two time points."

**Q: What does the 'Confidence Score' actually mean?**
**A:** "It represents the probability that the detected change is real and not just noise (like clouds or seasonal changes). It's derived from the consistency of the spectral signature changes."

**Q: How is this relevant to Smart City governance?**
**A:** "Smart cities need data. This dashboard directly helps in **Zoning Regulations** (identifying illegal sprawl), **Green Belt Protection** (monitoring forest loss), and **Water Conservation** (tracking water body shrinkage). It's a foundational tool for land governance."
