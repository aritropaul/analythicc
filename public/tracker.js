(function () {
  'use strict';
  var d = document;
  var w = window;
  var scriptEl = d.currentScript || (function () {
    var s = d.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  if (!scriptEl) return;

  var siteId = scriptEl.getAttribute('data-site');
  var endpoint = scriptEl.getAttribute('data-endpoint') ||
    (scriptEl.src ? new URL(scriptEl.src).origin + '/api/collect' : '/api/collect');
  if (!siteId) return;

  // Do not track in dev unless explicitly allowed.
  var host = location.hostname;
  if (!scriptEl.hasAttribute('data-track-localhost') &&
      (host === 'localhost' || host === '127.0.0.1' || host === '' || host.indexOf('.local') > -1)) {
    return;
  }

  // Respect DNT.
  if (scriptEl.hasAttribute('data-respect-dnt') && navigator.doNotTrack === '1') return;

  var sessionKey = '__ana_s';
  var visitorKey = '__ana_v';
  var SESSION_TTL = 30 * 60 * 1000;

  function uid() {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return 'x'.replace(/[x]/g, function () {
        return Math.floor(Math.random() * 16).toString(16);
      }) + Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.id && Date.now() - parsed.t < SESSION_TTL) {
          parsed.t = Date.now();
          sessionStorage.setItem(sessionKey, JSON.stringify(parsed));
          return parsed.id;
        }
      }
      var id = uid();
      sessionStorage.setItem(sessionKey, JSON.stringify({ id: id, t: Date.now() }));
      return id;
    } catch (e) {
      return uid();
    }
  }

  function getVisitor() {
    try {
      var v = localStorage.getItem(visitorKey);
      if (v) return v;
      var id = uid();
      localStorage.setItem(visitorKey, id);
      return id;
    } catch (e) {
      return uid();
    }
  }

  var session = getSession();
  var visitor = getVisitor();
  var pageStart = Date.now();
  var lastPath = location.pathname + location.search;
  var lastUrl = location.href;

  function send(payload, useBeacon) {
    payload.site = siteId;
    payload.session = session;
    payload.visitor = visitor;
    payload.ts = Date.now();
    payload.tz = (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null;
    payload.lang = navigator.language || null;
    payload.sw = w.screen ? w.screen.width : null;
    payload.sh = w.screen ? w.screen.height : null;
    try {
      var body = JSON.stringify(payload);
      if (useBeacon && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
          credentials: 'omit',
        }).catch(function () {});
      }
    } catch (e) {}
  }

  function trackPageview() {
    pageStart = Date.now();
    lastPath = location.pathname + location.search;
    lastUrl = location.href;
    send({
      type: 'pageview',
      url: location.href,
      path: lastPath,
      ref: d.referrer || '',
      title: d.title || '',
    });
  }

  function trackEnd() {
    var dur = Math.max(0, Math.round((Date.now() - pageStart) / 1000));
    if (dur < 1) return;
    send({
      type: 'session_end',
      url: lastUrl,
      path: lastPath,
      duration: dur,
    }, true);
  }

  // Custom events API: window.ana('event', name, props?)
  w.ana = function (action, name, props) {
    if (action === 'event' && name) {
      send({
        type: 'event',
        name: String(name).slice(0, 64),
        url: location.href,
        path: location.pathname + location.search,
        props: props || null,
      });
    } else if (action === 'pageview') {
      trackPageview();
    }
  };

  // Patch history for SPA nav.
  var push = history.pushState;
  var replace = history.replaceState;
  function hook(fn) {
    return function () {
      trackEnd();
      var r = fn.apply(this, arguments);
      setTimeout(trackPageview, 0);
      return r;
    };
  }
  history.pushState = hook(push);
  history.replaceState = hook(replace);
  w.addEventListener('popstate', function () {
    trackEnd();
    setTimeout(trackPageview, 0);
  });

  // End session on unload / tab hidden.
  w.addEventListener('visibilitychange', function () {
    if (d.visibilityState === 'hidden') trackEnd();
  });
  w.addEventListener('pagehide', trackEnd);

  // Initial pageview.
  if (d.readyState === 'complete' || d.readyState === 'interactive') {
    trackPageview();
  } else {
    d.addEventListener('DOMContentLoaded', trackPageview);
  }
})();
