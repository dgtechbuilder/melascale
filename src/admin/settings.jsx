/* Settings: where the data lives, and how to move from the demo workspace to Supabase. */
import React, { useState } from "react";
import { api, isDemo } from "../shared/api/index.js";
import { Button, Card, Code, Notice, Page } from "./ui.jsx";

export function SettingsPage({ session }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Page title="Settings" sub="Data backend and team access">
      <div className="adm-grid adm-grid-2">
        <Card title="Data backend" sub={isDemo ? "Demo workspace" : "Supabase"}>
          {isDemo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <Notice tone="warn">This is the demo workspace. Games, clients, campaigns, keys and test events are saved in this browser only, and the 30-day history for live games is generated sample traffic.</Notice>
              <div>To collect real analytics from game builds and give clients their own logins, connect a Supabase project:</div>
              <ol className="adm-steps">
                <li>Create a Supabase project and run <code>supabase/migrations/0001_mela_scale.sql</code>.</li>
                <li>Deploy the ingest function: <code>supabase functions deploy ingest --no-verify-jwt</code>.</li>
                <li>Add your team to the <code>staff</code> table.</li>
                <li>Build with <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> set (GitHub repository variables for the Pages deploy).</li>
              </ol>
              <div>Full steps are in <code>docs/BACKEND.md</code>.</div>
              {api.capabilities.reset && (
                confirm ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span>Reset the demo workspace? Your changes in this browser are lost.</span>
                    <Button kind="danger" onClick={async () => { await api.reset(); setConfirm(false); }}>Reset demo data</Button>
                    <Button kind="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
                  </div>
                ) : <div><Button kind="ghost" onClick={() => setConfirm(true)}>Reset demo data…</Button></div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Notice tone="good">Connected. Games send events to the ingest function below.</Notice>
              <Code label="Ingest endpoint">{api.ingestUrl}</Code>
            </div>
          )}
        </Card>
        <Card title="Team access" sub="Who can use this admin portal">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <div>Signed in as <b>{session.name}</b> ({session.email}).</div>
            {isDemo
              ? <div className="adm-muted">In the demo, the admin portal opens without sign-in.</div>
              : <>
                  <div>Team members are the rows in the <code>staff</code> table. Add someone with:</div>
                  <Code label="SQL">{`insert into public.staff (email, name, role)\nvalues ('name@kuntacontent.com', 'Name', 'admin');`}</Code>
                </>}
          </div>
        </Card>
      </div>
    </Page>
  );
}
