/* Copy-paste integration snippets shown on a game's Connect tab. */

export function snippets({ endpoint, key, placements, game }) {
  const k = key || "YOUR_API_KEY";
  const p = placements[0] ? placements[0].key : "placement-key";
  const plat = game.platforms.includes("webgl") ? "webgl" : game.platforms[0] || "mobile";
  return {
    js: `<!-- WebGL / browser build -->
<script src="https://your-cdn/mela-sdk.js"></script>  <!-- sdk/mela-sdk.js in this repo -->
<script>
  const mela = MelaScale.init({
    endpoint: "${endpoint}",
    apiKey: "${k}",
    platform: "${plat}",
    region: "emea",              // na | emea | apac | latam
  });

  mela.sessionStart();
  // when the placement renders:
  mela.impression("${p}");
  // after it has been ≥50% on screen for 1s:
  mela.viewable("${p}", { dwell_ms: 1200 });
  // when the player touches / equips / uses it:
  mela.interaction("${p}");
  // on quit (flushes the queue with sendBeacon):
  window.addEventListener("pagehide", () => mela.sessionEnd());
</script>`,
    unity: `// Unity (C#) — add sdk/unity/MelaScale.cs to Assets/Scripts
using UnityEngine;

public class MelaBootstrap : MonoBehaviour {
    void Start() {
        MelaScale.Init(
            endpoint: "${endpoint}",
            apiKey: "${k}",
            platform: Application.platform == RuntimePlatform.WebGLPlayer ? "webgl" : "mobile",
            region: "emea");
        MelaScale.SessionStart();
    }
    void OnApplicationQuit() { MelaScale.SessionEnd(); }
}

// On a placement's GameObject:
// MelaScale.Impression("${p}");
// MelaScale.Viewable("${p}");
// MelaScale.Interaction("${p}");`,
    curl: `curl -X POST "${endpoint}" \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${k}" \\
  -d '{
    "events": [
      { "event": "session_start", "session_id": "s-123", "player_id": "p-42", "platform": "${plat}", "region": "emea" },
      { "event": "impression", "placement": "${p}", "session_id": "s-123", "player_id": "p-42", "platform": "${plat}", "region": "emea" },
      { "event": "interaction", "placement": "${p}", "session_id": "s-123", "player_id": "p-42", "platform": "${plat}", "region": "emea" }
    ]
  }'`,
  };
}
