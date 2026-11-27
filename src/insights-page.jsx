import React, { useState as useS, useMemo as useM } from "react";
import { INSIGHTS } from "./data.jsx";
import { InsightCard } from "./app.jsx";
/* AI Insights Page — full-page view of AI-driven insights */


export function AIInsightsPage() {
  const [generating, setGenerating] = useS(false);
  const [openIdx, setOpenIdx] = useS(0);
  const [query, setQuery] = useS("");

  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>AI Chat Insights</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Synthesized from 12.7M events · Updated 4 min ago</div>
        </div>
        <button onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 1400); }} style={{
          padding: "9px 16px", borderRadius: 10, border: "1px solid var(--line)",
          background: "var(--surface)", fontSize: 13, fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          color: "var(--ink-2)",
        }}>
          {generating ? "Thinking…" : "↻ Regenerate all"}
        </button>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
        {/* Insights list */}
        <div style={{
          background: "linear-gradient(180deg, var(--ai-grad-top) 0%, var(--surface) 40%)",
          border: "1px solid var(--line)", borderRadius: 14, padding: 0, overflow: "hidden",
        }}>
          <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line-2)" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, var(--primary), oklch(0.66 0.18 35))",
              display: "grid", placeItems: "center", color: "white", fontSize: 14, fontWeight: 600,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>What's driving traction</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{INSIGHTS.length} insights generated</div>
            </div>
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {INSIGHTS.map((ins, i) => (
              <InsightCard key={i} insight={ins} open={i === openIdx} onToggle={() => setOpenIdx(i === openIdx ? -1 : i)} loading={generating} />
            ))}
          </div>
        </div>

        {/* Ask a question panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Ask about your data</div>
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. What placement type drives the highest recall?" style={{
                width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--line)",
                borderRadius: 10, background: "var(--surface-2)", fontSize: 12.5,
                color: "var(--ink)", fontFamily: "var(--font-sans)", outline: "none",
                resize: "vertical", boxSizing: "border-box",
              }} />
              <button style={{
                padding: "9px 16px", borderRadius: 10, border: "none",
                background: "var(--ink)", color: "var(--surface)", fontSize: 12.5, fontWeight: 500,
                cursor: "pointer", alignSelf: "flex-end",
              }}>Ask ✦</button>
            </div>
          </div>

          {/* Quick prompts */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10 }}>Suggested questions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Which placement has the best cost efficiency?",
                "Compare WebGL vs Mobile recall rates",
                "What's driving the engagement lift this week?",
                "Recommend budget reallocation",
              ].map((q, i) => (
                <button key={i} onClick={() => setQuery(q)} style={{
                  textAlign: "left", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid var(--line-2)", background: "var(--surface-2)",
                  fontSize: 12, color: "var(--ink-2)", cursor: "pointer",
                  transition: "background .1s",
                }} onMouseOver={e => e.currentTarget.style.background = "var(--line-2)"}
                   onMouseOut={e => e.currentTarget.style.background = "var(--surface-2)"}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10 }}>Data sources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Game telemetry", value: "12.7M events", status: "live" },
                { label: "Placement metrics", value: "14 active", status: "live" },
                { label: "Social mentions", value: "18.4K tracked", status: "live" },
                { label: "Revenue data", value: "Last sync 2h ago", status: "synced" },
              ].map((src, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                  borderBottom: i < 3 ? "1px solid var(--line-2)" : "none",
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 3,
                    background: src.status === "live" ? "var(--good)" : "var(--ink-3)",
                  }} />
                  <span style={{ flex: 1, fontSize: 12, color: "var(--ink)" }}>{src.label}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{src.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
