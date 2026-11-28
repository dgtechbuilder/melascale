import React, { useState, useRef, useEffect, useMemo } from "react";
import { CAMPAIGN, GAMES, PLACEMENT_ROWS, fmtMoney, fmtNum } from "./data.jsx";
import { useClient } from "./context.js";
import { campaignStatus } from "../shared/schema.js";
import { fmtDate } from "../shared/format.js";
import { PlacementTable } from "./app.jsx";
/* Placements Page — inventory & management view */


export const PLACEMENT_STATUSES = [
  { id: "draft", label: "Draft", color: "var(--ink-3)", bg: "var(--surface-2)" },
  { id: "proposed", label: "Proposed", color: "oklch(0.50 0.14 285)", bg: "oklch(0.94 0.03 285)" },
  { id: "agreed", label: "Agreed", color: "oklch(0.52 0.14 55)", bg: "oklch(0.94 0.04 55)" },
  { id: "live", label: "Live", color: "var(--good)", bg: "var(--good-soft)" },
  { id: "completed", label: "Completed", color: "var(--ink-2)", bg: "var(--surface-2)" },
];

export const PLACEMENT_TYPES = [
  { id: "placement", label: "Placement", color: "var(--primary)", bg: "var(--primary-soft)" },
  { id: "training", label: "Training", color: "oklch(0.58 0.16 30)", bg: "oklch(0.94 0.04 30)" },
  { id: "marketing", label: "Marketing", color: "oklch(0.52 0.14 180)", bg: "oklch(0.93 0.04 180)" },
];

export const PLACEMENT_SUBTYPES = [
  "Billboard", "Cosmetic", "Cutscene", "Environmental", "Branded Item",
  "Interstitial", "Tutorial Segment", "Co-branded Event",
];

export const PARTNERS = [
  "Northwind Goods", "Sierra Outdoors", "Meridian Foods", "Apex Sportswear", "Coastal Brewing Co."
];

export const OWNERS = [
  { name: "Kemi O.", initials: "KO", hue: 285 },
  { name: "Tomás R.", initials: "TR", hue: 155 },
  { name: "Anya S.", initials: "AS", hue: 45 },
  { name: "Devin M.", initials: "DM", hue: 350 },
  { name: "Lina P.", initials: "LP", hue: 210 },
];

/* Mock placements data */
/* Design sample inventory (kept for reference; the page now shows the campaign's placements). */
export const SAMPLE_PLACEMENT_INVENTORY = [
  { id: 1,  name: "Spring Planting Billboard",    type: "placement", subtype: "Billboard",       partner: "Northwind Goods",    status: "live",      value: 42000,  owner: OWNERS[0], endDate: "Jun 1, 2026",  level: "Sunfield Valley",  impressions: 3120000, ctr: 1.4 },
  { id: 2,  name: "Branded Crop Seeds",           type: "placement", subtype: "Cosmetic",        partner: "Northwind Goods",    status: "live",      value: 68000,  owner: OWNERS[0], endDate: "Jun 1, 2026",  level: "Sunfield Valley",  impressions: 2410000, ctr: 4.8 },
  { id: 3,  name: "Harvest Tutorial Module",      type: "training",  subtype: "Tutorial Segment", partner: "Northwind Goods",   status: "live",      value: 35000,  owner: OWNERS[1], endDate: "May 28, 2026", level: "Harvest Hollow",   impressions: 980000,  ctr: 6.1 },
  { id: 4,  name: "Grain Silo Signage",           type: "placement", subtype: "Environmental",   partner: "Northwind Goods",    status: "live",      value: 28000,  owner: OWNERS[2], endDate: "Jun 1, 2026",  level: "Harvest Hollow",   impressions: 1870000, ctr: 3.2 },
  { id: 5,  name: "Tractor Wrap — Highland",      type: "placement", subtype: "Cosmetic",        partner: "Northwind Goods",    status: "live",      value: 22000,  owner: OWNERS[4], endDate: "Jun 1, 2026",  level: "Highland Pastures", impressions: 612000,  ctr: 5.3 },
  { id: 6,  name: "Summer Splash Event",          type: "marketing", subtype: "Co-branded Event", partner: "Coastal Brewing Co.", status: "proposed", value: 95000,  owner: OWNERS[3], endDate: "Jul 15, 2026", level: "Coastal Acres",    impressions: null,    ctr: null },
  { id: 7,  name: "Sierra Outdoor Trail Pack",    type: "placement", subtype: "Branded Item",    partner: "Sierra Outdoors",    status: "agreed",    value: 55000,  owner: OWNERS[1], endDate: "Jun 20, 2026", level: "Cedar Heights",    impressions: null,    ctr: null },
  { id: 8,  name: "Meridian Farmers Market",      type: "marketing", subtype: "Environmental",   partner: "Meridian Foods",     status: "proposed",  value: 72000,  owner: OWNERS[2], endDate: "Jul 1, 2026",  level: "Sunfield Valley",  impressions: null,    ctr: null },
  { id: 9,  name: "Apex Sportswear Runner Kit",   type: "placement", subtype: "Cosmetic",        partner: "Apex Sportswear",    status: "draft",     value: 38000,  owner: OWNERS[3], endDate: "Aug 1, 2026",  level: "Highland Pastures", impressions: null,    ctr: null },
  { id: 10, name: "Cedar Heights Cutscene Spot",  type: "placement", subtype: "Cutscene",        partner: "Northwind Goods",    status: "completed", value: 31000,  owner: OWNERS[0], endDate: "May 10, 2026", level: "Cedar Heights",    impressions: 740000,  ctr: 5.8 },
  { id: 11, name: "Feed Bag Branding — Cedar",    type: "placement", subtype: "Environmental",   partner: "Northwind Goods",    status: "completed", value: 18000,  owner: OWNERS[4], endDate: "May 10, 2026", level: "Cedar Heights",    impressions: 1240000, ctr: 2.7 },
  { id: 12, name: "Coastal Billboard — Harbor",   type: "placement", subtype: "Billboard",       partner: "Northwind Goods",    status: "live",      value: 24000,  owner: OWNERS[1], endDate: "Jun 1, 2026",  level: "Coastal Acres",    impressions: 2800000, ctr: 1.8 },
  { id: 13, name: "Pre-season Training Camp",     type: "training",  subtype: "Interstitial",    partner: "Sierra Outdoors",    status: "draft",     value: 41000,  owner: OWNERS[2], endDate: "Aug 15, 2026", level: "Highland Pastures", impressions: null,    ctr: null },
  { id: 14, name: "Town Square Mural",            type: "placement", subtype: "Environmental",   partner: "Meridian Foods",     status: "agreed",    value: 47000,  owner: OWNERS[4], endDate: "Jun 28, 2026", level: "Sunfield Valley",  impressions: null,    ctr: null },
];

export function getStatusInfo(id) { return PLACEMENT_STATUSES.find(s => s.id === id) || PLACEMENT_STATUSES[0]; }
export function getTypeInfo(id) { return PLACEMENT_TYPES.find(t => t.id === id) || PLACEMENT_TYPES[0]; }

/* The signed-in client's campaign placements, in the inventory shape the design uses. */
function campaignInventory(ctx) {
  const st = ctx ? campaignStatus(ctx.current, ctx.today) : "live";
  const status = st === "scheduled" ? "agreed" : st === "draft" ? "draft" : st;
  const total = PLACEMENT_ROWS.reduce((a, r) => a + r.impressions, 0) || 1;
  return PLACEMENT_ROWS.map((r, i) => ({
    id: r.id, name: r.detail,
    type: r.kind === "tutorial" ? "training" : r.kind === "event" ? "marketing" : "placement",
    subtype: r.placement, partner: CAMPAIGN.brand, status,
    value: Math.round((CAMPAIGN.budget * r.impressions) / total),
    owner: OWNERS[i % OWNERS.length], endDate: fmtDate(CAMPAIGN.endsAt), level: r.game,
    impressions: r.impressions || null, ctr: r.ctr,
  }));
}

export function PlacementsPage() {
  const ctx = useClient();
  const PLACEMENT_INVENTORY = useMemo(() => campaignInventory(ctx), [ctx, PLACEMENT_ROWS]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return PLACEMENT_INVENTORY.filter(p => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (partnerFilter !== "all" && p.partner !== partnerFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.partner.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [PLACEMENT_INVENTORY, typeFilter, statusFilter, partnerFilter, search]);

  const stats = useMemo(() => {
    const all = PLACEMENT_INVENTORY;
    const live = all.filter(p => p.status === "live");
    const pipeline = all.filter(p => ["draft", "proposed", "agreed"].includes(p.status));
    const expiring = all.filter(p => {
      if (p.status !== "live") return false;
      const d = new Date(p.endDate);
      const now = new Date();
      return (d - now) / 86400000 < 30;
    });
    return [
      { label: "Live", value: live.length, color: "var(--good)" },
      { label: "Pipeline value", value: "$" + (pipeline.reduce((s, p) => s + p.value, 0) / 1000).toFixed(0) + "K", color: "var(--primary)" },
      { label: "Expiring <30d", value: expiring.length, color: "var(--accent)" },
      { label: "Total", value: all.length, color: "var(--ink-2)" },
    ];
  }, [PLACEMENT_INVENTORY]);

  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Placements</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Your in-game placements in {CAMPAIGN.game} for {CAMPAIGN.name}</div>
        </div>
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 10, padding: 3, border: "1px solid var(--line)" }}>
          {[{ id: "table", icon: "☰" }, { id: "kanban", icon: "▣" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13,
              background: view === v.id ? "var(--surface)" : "transparent",
              boxShadow: view === v.id ? "var(--shadow-sm)" : "none",
              color: view === v.id ? "var(--ink)" : "var(--ink-3)",
              cursor: "pointer", fontWeight: 500,
            }}>{v.icon}</button>
          ))}
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 14px",
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }} className="mono tnum">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 18 }}>
        <PlacementFilterPill label="Type" value={typeFilter} options={[{ id: "all", label: "All types" }, ...PLACEMENT_TYPES.map(t => ({ id: t.id, label: t.label }))]} onChange={setTypeFilter} />
        <PlacementFilterPill label="Status" value={statusFilter} options={[{ id: "all", label: "All statuses" }, ...PLACEMENT_STATUSES.map(s => ({ id: s.id, label: s.label }))]} onChange={setStatusFilter} />
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", border: "1px solid var(--line)", borderRadius: 999,
          background: "var(--surface)", marginLeft: "auto",
        }}>
          <span style={{ color: "var(--ink-3)", fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search placements…" style={{
            border: "none", outline: "none", background: "transparent", fontSize: 12.5,
            color: "var(--ink)", width: 160, fontFamily: "var(--font-sans)",
          }} />
        </div>
      </div>

      {/* View */}
      {view === "table" ? (
        <PlacementsTable rows={filtered} onSelect={setSelected} selected={selected} />
      ) : (
        <PlacementsKanban rows={filtered} onSelect={setSelected} />
      )}

      {/* Placement performance table */}
      <div style={{ marginTop: 24 }}>
        <PlacementTable />
      </div>

      {/* Detail drawer */}
      {selected && <PlacementDrawer item={selected} onClose={() => setSelected(null)} />}

      {/* Add modal */}
      {addOpen && <AddPlacementModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

/* ───── Filter pill ───── */
export function PlacementFilterPill({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sel = options.find(o => o.id === value);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", border: "1px solid var(--line)", borderRadius: 999,
        background: value !== "all" ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer", fontSize: 12.5, color: "var(--ink-2)",
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500, color: "var(--ink)" }}>· {sel ? sel.label : "All"}</span>
        <span style={{ fontSize: 10, marginLeft: 2 }}>⌄</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 40,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10,
          boxShadow: "var(--shadow-md)", padding: 4, minWidth: 180,
        }}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", padding: "7px 10px",
              border: "none", borderRadius: 7, fontSize: 12.5, cursor: "pointer",
              background: o.id === value ? "var(--surface-2)" : "transparent",
              color: "var(--ink)", fontWeight: o.id === value ? 600 : 400,
            }}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Table view ───── */
export function PlacementsTable({ rows, onSelect, selected }) {
  const cols = [
    { key: "name", label: "Name", flex: 2.5 },
    { key: "type", label: "Type", flex: 1 },
    { key: "subtype", label: "Sub-Type", flex: 1.1 },
    { key: "partner", label: "Partner", flex: 1.4 },
    { key: "status", label: "Status", flex: 0.9 },
    { key: "value", label: "Value", flex: 0.8 },
    { key: "owner", label: "Owner", flex: 0.8 },
    { key: "endDate", label: "End Date", flex: 0.9 },
  ];

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        {cols.map(c => (
          <div key={c.key} style={{ flex: c.flex, fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>{c.label}</div>
        ))}
      </div>
      {/* Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No placements match the current filters</div>
      ) : rows.map(row => {
        const st = getStatusInfo(row.status);
        const tp = getTypeInfo(row.type);
        const isActive = selected && selected.id === row.id;
        return (
          <button key={row.id} onClick={() => onSelect(row)} style={{
            display: "flex", alignItems: "center", padding: "9px 14px", width: "100%",
            borderBottom: "1px solid var(--line-2)", background: isActive ? "var(--primary-soft)" : "transparent",
            cursor: "pointer", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--line-2)",
            transition: "background .1s",
          }}>
            <div style={{ flex: 2.5, fontSize: 12, fontWeight: 500, color: "var(--ink)", textAlign: "left" }}>{row.name}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 5, background: tp.bg, color: tp.color }}>{tp.label}</span>
            </div>
            <div style={{ flex: 1.1, fontSize: 11.5, color: "var(--ink-2)", textAlign: "left" }}>{row.subtype}</div>
            <div style={{ flex: 1.4, fontSize: 11.5, color: "var(--ink-2)", textAlign: "left" }}>{row.partner}</div>
            <div style={{ flex: 0.9 }}>
              <span style={{ fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 5, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ flex: 0.8, fontSize: 11.5, fontWeight: 500, textAlign: "left" }} className="mono tnum">{fmtMoney(row.value)}</div>
            <div style={{ flex: 0.8, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: `oklch(0.55 0.12 ${row.owner.hue})`, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: "white" }}>{row.owner.initials}</div>
              <span style={{ fontSize: 11, color: "var(--ink-2)" }}>{row.owner.name}</span>
            </div>
            <div style={{ flex: 0.9, fontSize: 11, color: "var(--ink-3)", textAlign: "left" }} className="mono">{row.endDate}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ───── Kanban view ───── */
export function PlacementsKanban({ rows, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {PLACEMENT_STATUSES.map(st => {
        const cards = rows.filter(r => r.status === st.id);
        return (
          <div key={st.id} style={{ flex: "1 0 220px", minWidth: 220 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "0 4px",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: st.color }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{st.label}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{cards.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cards.map(card => {
                const tp = getTypeInfo(card.type);
                return (
                  <button key={card.id} onClick={() => onSelect(card)} style={{
                    padding: 14, borderRadius: 12, background: "var(--surface)",
                    border: "1px solid var(--line)", cursor: "pointer", textAlign: "left",
                    width: "100%", transition: "box-shadow .15s",
                  }} onMouseOver={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                     onMouseOut={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{card.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: tp.bg, color: tp.color, fontWeight: 500 }}>{tp.label}</span>
                      <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", color: "var(--ink-3)" }}>{card.subtype}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }} className="mono tnum">{fmtMoney(card.value)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, background: `oklch(0.55 0.12 ${card.owner.hue})`, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: "white" }}>{card.owner.initials}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>{card.partner} · {card.level}</div>
                  </button>
                );
              })}
              {cards.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--ink-3)", borderRadius: 10, border: "1px dashed var(--line)", background: "var(--surface)" }}>
                  No placements
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───── Detail drawer ───── */
export function PlacementDrawer({ item, onClose }) {
  const st = getStatusInfo(item.status);
  const tp = getTypeInfo(item.type);
  const drawerRef = useRef(null);

  useEffect(() => {
    const h = e => { if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 10);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const activityLog = [
    { t: "May 20", txt: `Status changed to "${st.label}" by ${item.owner.name}` },
    { t: "May 18", txt: "Contract signed — MoU v2 uploaded" },
    { t: "May 14", txt: `Value updated to ${fmtMoney(item.value)}` },
    { t: "May 10", txt: "Placement created by Kemi O." },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "oklch(0.2 0 0 / 0.25)" }} />
      <div ref={drawerRef} style={{
        position: "relative", width: 460, maxWidth: "90vw", height: "100vh",
        background: "var(--surface)", borderLeft: "1px solid var(--line)",
        boxShadow: "-8px 0 30px oklch(0.1 0 0 / 0.08)",
        overflowY: "auto", padding: 28,
        animation: "slideInRight .2s ease",
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 6 }}>{item.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: tp.bg, color: tp.color, fontWeight: 500 }}>{tp.label}</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--surface-2)", color: "var(--ink-3)" }}>{item.subtype}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            border: "1px solid var(--line)", background: "var(--surface)", borderRadius: 8,
            width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer",
            fontSize: 14, color: "var(--ink-3)",
          }}>✕</button>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <DrawerField label="Partner" value={item.partner} />
          <DrawerField label="Game level" value={item.level} />
          <DrawerField label="Value" value={fmtMoney(item.value)} />
          <DrawerField label="End date" value={item.endDate} />
          <DrawerField label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: `oklch(0.55 0.12 ${item.owner.hue})`, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: "white" }}>{item.owner.initials}</div>
              <span style={{ fontSize: 13 }}>{item.owner.name}</span>
            </div>
          </DrawerField>
          <DrawerField label="Platform" value={item.impressions ? "Mobile / WebGL" : "—"} />
        </div>

        {/* Linked documents */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} className="mono">Documents</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["MoU — Signed v2.pdf", "Campaign brief.docx", "Asset pack.zip"].map(doc => (
              <div key={doc} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--line)",
              }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <span style={{ fontSize: 12.5, flex: 1 }}>{doc}</span>
                <span style={{ fontSize: 11, color: "var(--primary)", cursor: "pointer" }}>View</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live performance */}
        {item.impressions && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Live performance</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <MiniMetric label="Impressions" value={fmtNum(item.impressions)} />
              <MiniMetric label="CTR" value={item.ctr + "%"} />
              <MiniMetric label="Est. recall" value={Math.round(item.ctr * 8.2) + "%"} />
            </div>
          </div>
        )}

        {/* Activity log */}
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {activityLog.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "10px 0",
                borderBottom: i < activityLog.length - 1 ? "1px solid var(--line-2)" : "none",
              }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)", minWidth: 52, flexShrink: 0 }} className="mono">{a.t}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{a.txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DrawerField({ label, value, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }} className="mono">{label}</div>
      {children || <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>}
    </div>
  );
}

export function MiniMetric({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }} className="mono">{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }} className="mono tnum">{value}</div>
    </div>
  );
}

/* ───── Add Placement Modal ───── */
export function AddPlacementModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, display: "grid", placeItems: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "oklch(0.2 0 0 / 0.35)" }} />
      <div style={{
        position: "relative", width: 480, maxWidth: "90vw", background: "var(--surface)",
        borderRadius: 16, border: "1px solid var(--line)", boxShadow: "var(--shadow-md)", padding: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Add new placement</div>
          <button onClick={onClose} style={{ border: "1px solid var(--line)", background: "var(--surface)", borderRadius: 8, width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 12, color: "var(--ink-3)" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Placement name" placeholder="e.g. Summer Billboard — Coastal" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormSelect label="Type" options={["Placement", "Training", "Marketing"]} />
            <FormSelect label="Sub-type" options={PLACEMENT_SUBTYPES} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormSelect label="Partner" options={PARTNERS} />
            <FormSelect label="Status" options={PLACEMENT_STATUSES.map(s => s.label)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Value ($)" placeholder="0.00" />
            <FormField label="End date" placeholder="YYYY-MM-DD" />
          </div>
          <FormSelect label="Game level" options={GAMES.filter(g => g.id !== "all").map(g => g.label)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, cursor: "pointer", color: "var(--ink-2)" }}>Cancel</button>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--ink)", color: "var(--surface)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Create placement</button>
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-2)", marginBottom: 5 }}>{label}</div>
      <input placeholder={placeholder} style={{
        width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8,
        background: "var(--surface)", fontSize: 13, color: "var(--ink)",
        fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

export function FormSelect({ label, options }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-2)", marginBottom: 5 }}>{label}</div>
      <select style={{
        width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8,
        background: "var(--surface)", fontSize: 13, color: "var(--ink)",
        fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
        appearance: "none",
      }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
