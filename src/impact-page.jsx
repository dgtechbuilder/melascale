import React, { useState as useS, useMemo as useM } from "react";
import { fmtMoney } from "./data.jsx";
/* Business Impact Page */


export const REVENUE_MONTHLY = [
  { month: "Jan", revenue: 82000, adRevenue: 34000, iap: 48000 },
  { month: "Feb", revenue: 91000, adRevenue: 38000, iap: 53000 },
  { month: "Mar", revenue: 105000, adRevenue: 42000, iap: 63000 },
  { month: "Apr", revenue: 118000, adRevenue: 49000, iap: 69000 },
  { month: "May", revenue: 134000, adRevenue: 56000, iap: 78000 },
];

export const ROAS_BY_PLACEMENT = [
  { name: "Cosmetic — Crop Seeds", spend: 12400, revenue: 51800, roas: 4.18 },
  { name: "Billboard — Sunfield", spend: 8200, revenue: 28700, roas: 3.50 },
  { name: "Environmental — Silo", spend: 6800, revenue: 21760, roas: 3.20 },
  { name: "Cutscene — Cedar", spend: 9100, revenue: 25480, roas: 2.80 },
  { name: "Billboard — Coastal", spend: 5600, revenue: 14560, roas: 2.60 },
  { name: "Tractor Wrap", spend: 4200, revenue: 9660, roas: 2.30 },
];

export const MONETIZATION_METRICS = [
  { label: "Total campaign revenue", value: "$134K", delta: "+18.2%", sub: "vs previous period" },
  { label: "ROAS (blended)", value: "3.4×", delta: "+0.6×", sub: "above 2.0× target" },
  { label: "IAP uplift (exposed)", value: "+11.2%", delta: "+2.4%", sub: "vs non-exposed cohort" },
  { label: "LTV increase", value: "+$1.82", delta: "+14%", sub: "per exposed user" },
];

export const LTV_COHORTS = [
  { label: "Exposed — Mobile", d7: 2.40, d14: 4.10, d30: 7.80 },
  { label: "Non-exposed — Mobile", d7: 1.80, d14: 3.20, d30: 6.10 },
  { label: "Exposed — WebGL", d7: 3.10, d14: 5.40, d30: 9.60 },
  { label: "Non-exposed — WebGL", d7: 2.20, d14: 3.90, d30: 7.20 },
];

export function BusinessImpactPage() {
  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Business impact</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Revenue, monetization, and lifetime value analysis</div>
        </div>
        <button style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>↓ Export</button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {MONETIZATION_METRICS.map(m => (
          <div key={m.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">{m.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 999, color: "var(--good)", background: "var(--good-soft)" }} className="mono tnum">{m.delta}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + ROAS table */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Revenue trend */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Revenue trend</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Monthly revenue split by source</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--ink-2)", marginBottom: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--primary)" }} /> IAP</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "oklch(0.62 0.15 50)" }} /> Ad revenue</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200 }}>
            {REVENUE_MONTHLY.map(m => {
              const maxRev = 134000;
              const iapH = (m.iap / maxRev) * 180;
              const adH = (m.adRevenue / maxRev) * 180;
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "var(--ink)" }} className="mono tnum">${(m.revenue / 1000).toFixed(0)}K</div>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                    <div style={{ height: iapH, background: "var(--primary)", borderRadius: "6px 6px 0 0" }} />
                    <div style={{ height: adH, background: "oklch(0.62 0.15 50)", borderRadius: "0 0 6px 6px" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }} className="mono">{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROAS by placement */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>ROAS by placement</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Return on ad spend per placement type</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={biThStyle}>Placement</th>
                <th style={{ ...biThStyle, textAlign: "right" }}>Spend</th>
                <th style={{ ...biThStyle, textAlign: "right" }}>Revenue</th>
                <th style={{ ...biThStyle, textAlign: "right" }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {ROAS_BY_PLACEMENT.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtMoney(r.spend)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtMoney(r.revenue)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: r.roas >= 3 ? "var(--good)" : "var(--ink)" }} className="mono tnum">{r.roas.toFixed(2)}×</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LTV cohort table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Lifetime value by cohort</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Exposed vs non-exposed user LTV at D7, D14, D30</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface-2)" }}>
            <tr>
              <th style={biThStyle}>Cohort</th>
              <th style={{ ...biThStyle, textAlign: "right" }}>D7 LTV</th>
              <th style={{ ...biThStyle, textAlign: "right" }}>D14 LTV</th>
              <th style={{ ...biThStyle, textAlign: "right" }}>D30 LTV</th>
              <th style={{ ...biThStyle, textAlign: "right" }}>D7→D30 growth</th>
            </tr>
          </thead>
          <tbody>
            {LTV_COHORTS.map((c, i) => {
              const growth = ((c.d30 - c.d7) / c.d7 * 100).toFixed(0);
              const isExposed = c.label.includes("Exposed —") && !c.label.includes("Non");
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)", background: isExposed ? "var(--primary-soft)" : "transparent" }}>
                  <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: isExposed ? 600 : 400 }}>{c.label}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">${c.d7.toFixed(2)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">${c.d14.toFixed(2)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">${c.d30.toFixed(2)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--good)" }} className="mono tnum">+{growth}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const biThStyle = {
  textAlign: "left", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500,
  padding: "9px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};
