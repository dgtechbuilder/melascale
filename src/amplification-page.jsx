import React, { useState as useS } from "react";
import { AMPLIFICATION, fmtNum } from "./data.jsx";
/* Amplification Page */


export const SOCIAL_PLATFORMS = [
  { platform: "TikTok", mentions: 8420, growth: 32.4, sentiment: 82, topPost: "Farming challenge #NorthwindSeeds" },
  { platform: "YouTube", mentions: 3180, growth: 18.7, sentiment: 78, topPost: "Lima Farm speedrun w/ branded items" },
  { platform: "X (Twitter)", mentions: 4210, growth: 11.2, sentiment: 71, topPost: "Hidden Northwind Easter egg found!" },
  { platform: "Instagram", mentions: 2640, growth: 24.8, sentiment: 86, topPost: "Screenshot dump — Spring Planting" },
];

export const UGC_WEEKLY = [
  { week: "W1", screenshots: 820, clips: 340, streams: 12 },
  { week: "W2", screenshots: 1240, clips: 510, streams: 18 },
  { week: "W3", screenshots: 1680, clips: 720, streams: 24 },
  { week: "W4", screenshots: 2100, clips: 890, streams: 31 },
];

export const HASHTAG_DATA = [
  { tag: "#NorthwindGoods", mentions: 6840, trend: "up" },
  { tag: "#LimaFarming", mentions: 4210, trend: "up" },
  { tag: "#SpringPlanting", mentions: 3180, trend: "up" },
  { tag: "#SunfieldValley", mentions: 2470, trend: "flat" },
  { tag: "#FarmingGame", mentions: 1890, trend: "up" },
  { tag: "#BrandedSeeds", mentions: 1240, trend: "up" },
];

export const CAMPAIGN_POSTS = [
  { type: "Official", title: "Spring Planting launch trailer", platform: "YouTube", reach: 1240000, engRate: 8.4, date: "Apr 22" },
  { type: "Official", title: "Branded crop seeds reveal", platform: "TikTok", reach: 890000, engRate: 12.1, date: "Apr 25" },
  { type: "Influencer", title: "@farmgamer_pro playthrough", platform: "YouTube", reach: 620000, engRate: 6.8, date: "Apr 28" },
  { type: "Influencer", title: "@gamingwithAde review", platform: "TikTok", reach: 480000, engRate: 14.2, date: "May 1" },
  { type: "UGC", title: "Community screenshot contest", platform: "Instagram", reach: 340000, engRate: 9.6, date: "May 5" },
  { type: "Official", title: "Week 3 progress update", platform: "X (Twitter)", reach: 280000, engRate: 4.2, date: "May 10" },
];

export function AmplificationPage() {
  const [tab, setTab] = useS("overview");

  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Amplification</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Social reach, influencer performance, and user-generated content</div>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total mentions", value: fmtNum(AMPLIFICATION.socialMentions), delta: `+${AMPLIFICATION.socialDelta}%` },
          { label: "UGC this week", value: fmtNum(AMPLIFICATION.ugc), delta: "+28.4%" },
          { label: "Influencer reach", value: "4.2M", delta: "+18.6%" },
          { label: "Earned media value", value: "$186K", delta: "+22.1%" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500 }} className="tnum">{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--good)", marginTop: 4, fontWeight: 600 }} className="mono">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown + Hashtags */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Platform breakdown */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Platform breakdown</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Mentions and sentiment by platform</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={ampThStyle}>Platform</th>
                <th style={{ ...ampThStyle, textAlign: "right" }}>Mentions</th>
                <th style={{ ...ampThStyle, textAlign: "right" }}>Growth</th>
                <th style={ampThStyle}>Sentiment</th>
                <th style={ampThStyle}>Top post</th>
              </tr>
            </thead>
            <tbody>
              {SOCIAL_PLATFORMS.map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 500 }}>{p.platform}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtNum(p.mentions)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--good)" }} className="mono tnum">+{p.growth}%</span>
                  </td>
                  <td style={{ padding: "11px 14px", width: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--line-2)", borderRadius: 999 }}>
                        <div style={{ height: "100%", borderRadius: 999, background: p.sentiment >= 80 ? "var(--good)" : "oklch(0.65 0.12 55)", width: `${p.sentiment}%` }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: "var(--ink-3)" }} className="mono">{p.sentiment}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 11.5, color: "var(--ink-2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.topPost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trending hashtags */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>Trending hashtags</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {HASHTAG_DATA.map((h, i) => (
              <div key={h.tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--ink-3)", width: 18 }} className="mono">{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--primary)" }}>{h.tag}</span>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }} className="mono tnum">{fmtNum(h.mentions)}</span>
                <span style={{ fontSize: 11, color: h.trend === "up" ? "var(--good)" : "var(--ink-3)" }}>
                  {h.trend === "up" ? "↑" : "→"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UGC trend + Campaign posts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
        {/* UGC weekly trend */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>UGC weekly trend</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Player-created content volume</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--ink-2)", marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--primary)" }} /> Screenshots</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "oklch(0.58 0.16 35)" }} /> Clips</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "oklch(0.55 0.13 175)" }} /> Streams</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
            {UGC_WEEKLY.map(w => {
              const maxV = 2100;
              return (
                <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
                    <div style={{ flex: 1, height: (w.screenshots / maxV) * 130, background: "var(--primary)", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ flex: 1, height: (w.clips / maxV) * 130, background: "oklch(0.58 0.16 35)", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ flex: 1, height: Math.max(4, (w.streams / maxV) * 130), background: "oklch(0.55 0.13 175)", borderRadius: "4px 4px 0 0" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }} className="mono">{w.week}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign posts */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Campaign content performance</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Official, influencer, and UGC posts</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={ampThStyle}>Type</th>
                <th style={ampThStyle}>Title</th>
                <th style={ampThStyle}>Platform</th>
                <th style={{ ...ampThStyle, textAlign: "right" }}>Reach</th>
                <th style={{ ...ampThStyle, textAlign: "right" }}>Eng. rate</th>
                <th style={ampThStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGN_POSTS.map((p, i) => {
                const typeColor = p.type === "Official" ? "var(--primary)" : p.type === "Influencer" ? "oklch(0.58 0.16 35)" : "oklch(0.55 0.13 175)";
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, color: typeColor, background: typeColor.includes("var") ? "var(--primary-soft)" : typeColor.replace(")", " / 0.12)") }}>{p.type}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-2)" }}>{p.platform}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtNum(p.reach)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12, fontWeight: 600 }} className="mono tnum">{p.engRate}%</td>
                    <td style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--ink-3)" }} className="mono">{p.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const ampThStyle = {
  textAlign: "left", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500,
  padding: "9px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};
