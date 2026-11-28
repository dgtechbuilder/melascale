import React from "react";

/* Marks a section whose figures are illustrative: no live source feeds it yet. */
export function SampleNote({ what, style }) {
  return (
    <div style={{
      gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      padding: "7px 12px", borderRadius: 10, border: "1px dashed var(--line)", background: "var(--surface-2)",
      fontSize: 12, color: "var(--ink-2)", ...style,
    }}>
      <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>Sample data</span>
      <span>{what} isn't connected yet, so these figures are illustrative.</span>
    </div>
  );
}
