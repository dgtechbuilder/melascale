// Mela Scale Unity SDK. Drop into Assets/Scripts. Works on mobile, desktop and WebGL builds.
//
//   MelaScale.Init(endpoint, apiKey, platform: "mobile", region: "emea");
//   MelaScale.SessionStart();
//   MelaScale.Impression("coastal-market-billboard");
//   MelaScale.Viewable("coastal-market-billboard");
//   MelaScale.Interaction("coastal-market-billboard");
//   MelaScale.SessionEnd();               // call from OnApplicationQuit / OnApplicationPause(true)
//
// Events are queued and posted in batches (every 5 s, or at 50 events) by a hidden runner object.
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public static class MelaScale
{
    struct Ev
    {
        public string Event, Placement, SessionId, Ts, PropsJson;
    }

    static string _endpoint, _apiKey, _platform = "mobile", _region = "unknown", _playerId, _sessionId;
    static float _sessionStartedAt;
    static readonly List<Ev> Queue = new List<Ev>();
    static Runner _runner;
    const int BatchSize = 50;
    const float FlushSeconds = 5f;
    public static bool Debug;

    public static void Init(string endpoint, string apiKey, string platform = "mobile", string region = "unknown")
    {
        _endpoint = endpoint;
        _apiKey = apiKey;
        _platform = platform;
        _region = region;
        _playerId = PlayerPrefs.GetString("mela-scale.player", "");
        if (string.IsNullOrEmpty(_playerId))
        {
            _playerId = Guid.NewGuid().ToString();
            PlayerPrefs.SetString("mela-scale.player", _playerId);
            PlayerPrefs.Save();
        }
        if (_runner == null)
        {
            var go = new GameObject("MelaScaleRunner") { hideFlags = HideFlags.HideAndDontSave };
            UnityEngine.Object.DontDestroyOnLoad(go);
            _runner = go.AddComponent<Runner>();
        }
    }

    public static void SetRegion(string region) { _region = region; }

    public static void SessionStart()
    {
        _sessionId = Guid.NewGuid().ToString();
        _sessionStartedAt = Time.realtimeSinceStartup;
        Track("session_start", null, null);
    }

    public static void SessionEnd()
    {
        if (_sessionId == null) return;
        var seconds = Mathf.RoundToInt(Time.realtimeSinceStartup - _sessionStartedAt);
        Track("session_end", null, "{\"duration_sec\":" + seconds.ToString(CultureInfo.InvariantCulture) + "}");
        _sessionId = null;
        Flush();
    }

    public static void Impression(string placement) { Track("impression", placement, null); }
    public static void Viewable(string placement, int dwellMs = 1000) { Track("viewable", placement, "{\"dwell_ms\":" + dwellMs.ToString(CultureInfo.InvariantCulture) + "}"); }
    public static void Interaction(string placement) { Track("interaction", placement, null); }
    public static void Click(string placement) { Track("click", placement, null); }
    public static void Conversion(double value = 0, string placement = null)
    {
        Track("conversion", placement, "{\"value\":" + value.ToString(CultureInfo.InvariantCulture) + "}");
    }

    static void Track(string ev, string placement, string propsJson)
    {
        if (_endpoint == null) { UnityEngine.Debug.LogWarning("[mela] Call MelaScale.Init first"); return; }
        if (_sessionId == null && ev != "session_start") SessionStart();
        Queue.Add(new Ev
        {
            Event = ev,
            Placement = placement,
            SessionId = _sessionId,
            Ts = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture),
            PropsJson = propsJson ?? "{}",
        });
        if (Queue.Count >= BatchSize) Flush();
    }

    public static void Flush()
    {
        if (Queue.Count == 0 || _runner == null) return;
        var batch = Queue.GetRange(0, Math.Min(Queue.Count, 500));
        Queue.RemoveRange(0, batch.Count);
        _runner.StartCoroutine(Post(batch));
    }

    static string Esc(string s)
    {
        if (s == null) return "null";
        var sb = new StringBuilder("\"");
        foreach (var c in s)
        {
            switch (c)
            {
                case '"': sb.Append("\\\""); break;
                case '\\': sb.Append("\\\\"); break;
                case '\n': sb.Append("\\n"); break;
                case '\r': sb.Append("\\r"); break;
                case '\t': sb.Append("\\t"); break;
                default:
                    if (c < 0x20) sb.Append("\\u").Append(((int)c).ToString("x4"));
                    else sb.Append(c);
                    break;
            }
        }
        return sb.Append('"').ToString();
    }

    static IEnumerator Post(List<Ev> batch)
    {
        var sb = new StringBuilder("{\"events\":[");
        for (int i = 0; i < batch.Count; i++)
        {
            var e = batch[i];
            if (i > 0) sb.Append(',');
            sb.Append("{\"event\":").Append(Esc(e.Event))
              .Append(",\"placement\":").Append(Esc(e.Placement))
              .Append(",\"session_id\":").Append(Esc(e.SessionId))
              .Append(",\"player_id\":").Append(Esc(_playerId))
              .Append(",\"platform\":").Append(Esc(_platform))
              .Append(",\"region\":").Append(Esc(_region))
              .Append(",\"ts\":").Append(Esc(e.Ts))
              .Append(",\"props\":").Append(e.PropsJson)
              .Append('}');
        }
        sb.Append("]}");
        using (var req = new UnityWebRequest(_endpoint, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(sb.ToString()));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("content-type", "application/json");
            req.SetRequestHeader("x-api-key", _apiKey);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                if (Debug) UnityEngine.Debug.LogWarning("[mela] send failed: " + req.error + ", requeueing");
                if (Queue.Count < 2000) Queue.InsertRange(0, batch);
            }
            else if (Debug) UnityEngine.Debug.Log("[mela] " + req.downloadHandler.text);
        }
    }

    class Runner : MonoBehaviour
    {
        float _next;
        void Update()
        {
            if (Time.realtimeSinceStartup >= _next)
            {
                _next = Time.realtimeSinceStartup + FlushSeconds;
                Flush();
            }
        }
        void OnApplicationPause(bool paused) { if (paused) Flush(); }
        void OnApplicationQuit() { SessionEnd(); }
    }
}
