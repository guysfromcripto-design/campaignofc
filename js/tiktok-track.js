/* Persist TikTok click IDs and attach them to the checkout URL. */
(function () {
  var STORE_KEY = "tt_click_params";
  var PARAMS = [
    "ttclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term"
  ];

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeStored(obj) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function captureClickParams() {
    var out = readStored();
    try {
      var url = new URL(window.location.href);
      PARAMS.forEach(function (key) {
        var value = url.searchParams.get(key);
        if (value) out[key] = value;
      });
    } catch (e) {}
    writeStored(out);
    return out;
  }

  function withTikTokParams(targetUrl) {
    var params = captureClickParams();
    try {
      var next = new URL(targetUrl, window.location.href);
      Object.keys(params).forEach(function (key) {
        if (params[key] && !next.searchParams.get(key)) {
          next.searchParams.set(key, params[key]);
        }
      });
      return next.toString();
    } catch (e) {
      return targetUrl;
    }
  }

  function trackThen(eventName, params, fn, waitMs) {
    try {
      if (window.trackTikTok) window.trackTikTok(eventName, params);
      else if (window.ttq && typeof window.ttq.track === "function") {
        window.ttq.track(eventName, params || {});
      }
    } catch (e) {}
    setTimeout(fn, waitMs || 450);
  }

  window.TTTrack = {
    captureClickParams: captureClickParams,
    withTikTokParams: withTikTokParams,
    trackThen: trackThen
  };

  captureClickParams();
})();
