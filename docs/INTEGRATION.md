# Sending analytics from a game

Every Kunta Content game reports to Mela Scale with its own API key. Create the key in the
admin portal (**Games → your game → Connect analytics**). The same page has copy-paste snippets
with the key and the game's placement keys filled in, and a **Send test event** button.

## Events

| `event` | Placement needed | Send when |
|---|---|---|
| `session_start` | no | The player opens the game |
| `session_end` | no | The session closes. `props.duration_sec` = seconds played |
| `impression` | yes | A branded placement renders on screen |
| `viewable` | yes | It has been ≥50% on screen for ≥1 s. `props.dwell_ms` optional |
| `interaction` | yes | The player touches, equips, uses or walks into it |
| `click` | yes | The player opens a brand link or offer |
| `conversion` | optional | An attributed purchase or sign-up. `props.value` optional |

Every event also carries `session_id` (required), `player_id` (a stable anonymous id; never an
email or real name), `platform` (`mobile`, `webgl`, `pc`, `console`), `region` (`na`, `emea`,
`apac`, `latam`) and an ISO `ts`. Batches go up to 500 events per request.

## WebGL / HTML5: `sdk/mela-sdk.js`

```html
<script src="mela-sdk.js"></script>
<script>
  const mela = MelaScale.init({ endpoint: "https://<ref>.supabase.co/functions/v1/ingest", apiKey: "msk_…", platform: "webgl", region: "emea" });
  mela.sessionStart();
  mela.impression("coastal-market-billboard");
  mela.viewable("coastal-market-billboard", { dwell_ms: 1200 });
  mela.interaction("coastal-market-billboard");
</script>
```

The SDK batches events (every 5 s or 50 events), retries failed sends, and closes the session with
`navigator.sendBeacon` when the page is hidden.

## Unity: `sdk/unity/MelaScale.cs`

Copy the file into `Assets/Scripts`, then:

```csharp
MelaScale.Init("https://<ref>.supabase.co/functions/v1/ingest", "msk_…", platform: "mobile", region: "emea");
MelaScale.SessionStart();
MelaScale.Impression("highland-tractor-wrap");
MelaScale.Viewable("highland-tractor-wrap");
MelaScale.Interaction("highland-tractor-wrap");
```

It posts batches with `UnityWebRequest`, flushes on pause, and ends the session on quit.

## Plain HTTP

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/ingest" \
  -H "content-type: application/json" -H "x-api-key: msk_…" \
  -d '{"events":[{"event":"impression","placement":"coastal-market-billboard","session_id":"s-1","platform":"mobile","region":"emea"}]}'
```

The response is `{ "accepted": n, "rejected": [{ "index": i, "reason": "…" }] }`. A bad or revoked key returns 401.
