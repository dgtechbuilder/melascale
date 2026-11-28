/* Clients: the brands buying placements, and the people who can sign in to the client portal. */
import React, { useState } from "react";
import { api, isDemo } from "../shared/api/index.js";
import { fmtDate, fmtMoney, initials, isoDay } from "../shared/format.js";
import { campaignStatus } from "../shared/schema.js";
import { Button, Card, ErrorText, Field, Input, Modal, Page, Table, Notice, useLoad } from "./ui.jsx";
import { CampaignStatus } from "./common.jsx";
import { CampaignModal } from "./campaigns.jsx";
import { go } from "./app.jsx";

function ClientMark({ client, size = 28 }) {
  return <span className="adm-chip" style={{ width: size, height: size, fontSize: size * 0.36, background: `oklch(0.55 0.13 ${client.hue ?? 80})` }} aria-hidden="true">{initials(client.name)}</span>;
}

export function ClientsPage() {
  const today = isoDay();
  const [adding, setAdding] = useState(false);
  const { data, error } = useLoad(async () => {
    const [clients, campaigns, users] = await Promise.all([api.listClients(), api.listCampaigns(), api.listClientUsers()]);
    return { clients, campaigns, users };
  }, [], { subscribe: api.subscribe });
  if (!data) return <Page title="Clients" sub={error || "Loading…"} />;
  return (
    <Page title="Clients" sub="Brands with campaigns in Kunta Content games. People you add here can sign in to the client portal."
      actions={<Button onClick={() => setAdding(true)}>+ Add client</Button>}>
      <Card pad={false}>
        <Table onRow={c => go(`clients/${c.id}`)} rows={data.clients} empty="No clients yet." columns={[
          { key: "name", label: "Client", render: c => <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><ClientMark client={c} /><span><b style={{ fontWeight: 600 }}>{c.name}</b><div className="adm-muted adm-small">{c.industry}</div></span></span> },
          { key: "users", label: "Portal users", align: "right", render: c => <span className="mono">{data.users.filter(u => u.client_id === c.id).length}</span> },
          { key: "live", label: "Live campaigns", align: "right", render: c => <span className="mono">{data.campaigns.filter(x => x.client_id === c.id && campaignStatus(x, today) === "live").length}</span> },
          { key: "budget", label: "Total budget", align: "right", render: c => <span className="mono tnum">{fmtMoney(data.campaigns.filter(x => x.client_id === c.id).reduce((a, x) => a + x.budget, 0))}</span> },
        ]} />
      </Card>
      {adding && <ClientModal onClose={() => setAdding(false)} onSaved={c => { setAdding(false); go(`clients/${c.id}`); }} />}
    </Page>
  );
}

function ClientModal({ client, onClose, onSaved }) {
  const [f, setF] = useState(() => client ? { ...client } : { name: "", industry: "", contact_email: "" });
  const [err, setErr] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async () => {
    setErr(null);
    if (!f.name.trim()) return setErr("Enter the client's name.");
    try {
      const saved = await api.saveClient({ ...f, name: f.name.trim(), contact_email: f.contact_email.trim().toLowerCase() });
      if (!client && saved.contact_email) await api.addClientUser(saved.id, saved.contact_email).catch(() => {});
      onSaved(saved);
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={client ? `Edit ${client.name}` : "Add a client"} onClose={onClose}
      footer={<><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{client ? "Save" : "Add client"}</Button></>}>
      <Field label="Company name" id="cl-name"><Input id="cl-name" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Hello Tractor" /></Field>
      <Field label="Industry" id="cl-ind"><Input id="cl-ind" value={f.industry} onChange={e => set("industry", e.target.value)} placeholder="Agritech" /></Field>
      <Field label="Main contact email" id="cl-email" hint={client ? undefined : "Gets client portal access straight away."}><Input id="cl-email" type="email" value={f.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="marketing@brand.com" /></Field>
      <ErrorText error={err} />
    </Modal>
  );
}

export function ClientDetail({ id }) {
  const today = isoDay();
  const [editing, setEditing] = useState(false);
  const [newCampaign, setNewCampaign] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(null);
  const { data, error } = useLoad(async () => {
    const [clients, campaigns, users, games] = await Promise.all([api.listClients(), api.listCampaigns({ clientId: id }), api.listClientUsers(id), api.listGames()]);
    return { client: clients.find(c => c.id === id), clients, campaigns, users, games };
  }, [id], { subscribe: api.subscribe });
  if (error) return <Page title="Client" sub={error} />;
  if (!data) return <Page title="Client" sub="Loading…" />;
  if (!data.client) return <Page title="Client not found" sub={<a className="adm-link" href="#/clients">Back to clients</a>} />;
  const { client } = data;
  const invite = async (e) => {
    e.preventDefault();
    setErr(null);
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return setErr("Enter a valid email address.");
    try { await api.addClientUser(client.id, v); setEmail(""); } catch (x) { setErr(x.message); }
  };
  const viewAs = async () => {
    if (isDemo) await api.signInAsClient(client.id);
    window.open("../client/", "_blank", "noopener");
  };
  return (
    <Page
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><ClientMark client={client} size={32} />{client.name}</span>}
      sub={<span style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}><a className="adm-back" href="#/clients">← Clients</a><span>{client.industry}</span><span>{client.contact_email}</span></span>}
      actions={<><Button kind="ghost" onClick={() => setEditing(true)}>Edit</Button><Button kind="ghost" onClick={viewAs}>{isDemo ? "View as client ↗" : "Client portal ↗"}</Button><Button onClick={() => setNewCampaign(true)}>+ New campaign</Button></>}>
      <div className="adm-grid adm-grid-main">
        <Card title="Campaigns" pad={false}>
          <Table onRow={c => go(`campaigns/${c.id}`)} rows={data.campaigns} empty="No campaigns yet." columns={[
            { key: "name", label: "Campaign", render: c => <b style={{ fontWeight: 600 }}>{c.name}</b> },
            { key: "game", label: "Game", render: c => (data.games.find(g => g.id === c.game_id) || {}).name },
            { key: "status", label: "Status", render: c => <CampaignStatus campaign={c} today={today} /> },
            { key: "dates", label: "Dates", render: c => <span className="adm-small">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span> },
            { key: "budget", label: "Budget", align: "right", render: c => <span className="mono tnum">{fmtMoney(c.budget)}</span> },
          ]} />
        </Card>
        <Card title="Client portal access" sub="These people can sign in and see this client's campaigns, and nothing else.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <form onSubmit={invite} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}><Field label="Add someone by email" id="cu-email"><Input id="cu-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@brand.com" /></Field></div>
              <Button type="submit">Give access</Button>
            </form>
            <ErrorText error={err} />
            {!isDemo && <Notice>They sign in at the client portal with a one-time email link.</Notice>}
            <Table rows={data.users} empty="Nobody has access yet." columns={[
              { key: "email", label: "Email", render: u => <span className="adm-small">{u.email}</span> },
              { key: "act", label: "", align: "right", render: u => <Button kind="danger" onClick={() => api.removeClientUser(u.id)}>Remove</Button> },
            ]} />
          </div>
        </Card>
      </div>
      {editing && <ClientModal client={client} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
      {newCampaign && <CampaignModal games={data.games} clients={data.clients} presetClient={client.id} onClose={() => setNewCampaign(false)} onSaved={c => go(`campaigns/${c.id}`)} />}
    </Page>
  );
}
