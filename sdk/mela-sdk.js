/*! Mela Scale browser SDK (WebGL / HTML5 games). No dependencies.
 *
 *   const mela = MelaScale.init({ endpoint, apiKey, platform: "webgl", region: "emea" });
 *   mela.sessionStart();
 *   mela.impression("coastal-market-billboard");
 *   mela.viewable("coastal-market-billboard", { dwell_ms: 1200 });
 *   mela.interaction("coastal-market-billboard");
 *   mela.sessionEnd();   // also sent automatically when the page is hidden
 *
 * Events are queued and sent in batches (every 5 s, or at 50 events).
 */
(function (root) {
  "use strict";

  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function playerId() {
    var k = "mela-scale.player";
    try {
      var v = root.localStorage.getItem(k);
      if (!v) { v = uuid(); root.localStorage.setItem(k, v); }
      return v;
    } catch (e) { return uuid(); }
  }

  function init(opts) {
    if (!opts || !opts.endpoint || !opts.apiKey) throw new Error("MelaScale.init needs { endpoint, apiKey }");
    var cfg = {
      endpoint: opts.endpoint,
      apiKey: opts.apiKey,
      platform: opts.platform || "webgl",
      region: opts.region || "unknown",
      playerId: opts.playerId || playerId(),
      flushMs: opts.flushIntervalMs || 5000,
      batch: opts.batchSize || 50,
      debug: !!opts.debug,
    };
    var queue = [];
    var sessionId = null;
    var startedAt = 0;
    var timer = null;

    function log() { if (cfg.debug && root.console) root.console.log.apply(root.console, ["[mela]"].concat([].slice.call(arguments))); }

    function track(event, placement, props) {
      if (!sessionId && event !== "session_start") api.sessionStart();
      queue.push({
        event: event,
        placement: placement || undefined,
        session_id: sessionId,
        player_id: cfg.playerId,
        platform: cfg.platform,
        region: cfg.region,
        ts: new Date().toISOString(),
        props: props || {},
      });
      if (queue.length >= cfg.batch) flush();
      else if (!timer) timer = setTimeout(flush, cfg.flushMs);
    }

    function flush(useBeacon) {
      clearTimeout(timer); timer = null;
      if (!queue.length) return Promise.resolve();
      var events = queue.splice(0, 500);
      var body = JSON.stringify({ events: events });
      if (useBeacon && root.navigator && root.navigator.sendBeacon) {
        // sendBeacon can't set headers, so the key goes in the query string.
        var sep = cfg.endpoint.indexOf("?") >= 0 ? "&" : "?";
        root.navigator.sendBeacon(cfg.endpoint + sep + "key=" + encodeURIComponent(cfg.apiKey), new Blob([body], { type: "text/plain" }));
        return Promise.resolve();
      }
      return fetch(cfg.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": cfg.apiKey },
        body: body,
        keepalive: body.length < 60000,
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { log("sent", events.length, r.status, j); }); })
        .catch(function (e) { log("send failed, requeueing", e); queue = events.concat(queue).slice(0, 2000); });
    }

    var api = {
      sessionStart: function () {
        sessionId = uuid();
        startedAt = Date.now();
        track("session_start");
      },
      sessionEnd: function () {
        if (!sessionId) return;
        track("session_end", null, { duration_sec: Math.round((Date.now() - startedAt) / 1000) });
        sessionId = null;
        flush(true);
      },
      impression: function (placement, props) { track("impression", placement, props); },
      viewable: function (placement, props) { track("viewable", placement, props); },
      interaction: function (placement, props) { track("interaction", placement, props); },
      click: function (placement, props) { track("click", placement, props); },
      conversion: function (props, placement) { track("conversion", placement, props); },
      setRegion: function (region) { cfg.region = region; },
      flush: function () { return flush(false); },
    };

    if (root.addEventListener) {
      root.addEventListener("pagehide", function () { api.sessionEnd(); });
      root.document && root.document.addEventListener("visibilitychange", function () {
        if (root.document.visibilityState === "hidden") flush(true);
      });
    }
    return api;
  }

  root.MelaScale = { init: init, version: "1.0.0" };
})(typeof window !== "undefined" ? window : this);
