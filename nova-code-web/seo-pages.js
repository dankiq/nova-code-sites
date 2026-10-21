(() => {
  const METRIKA_ID = 111133726;
  const params = new URLSearchParams(window.location.search);
  const attribution = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "yclid"].forEach((key) => {
    const value = params.get(key);
    if (value) attribution[key] = value.slice(0, 300);
  });
  if (Object.keys(attribution).length) {
    sessionStorage.setItem("twincode_utm", JSON.stringify(attribution));
  }

  window.dataLayer = window.dataLayer || [];
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(tag);
  window.ym(METRIKA_ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });

  const notify = (event, source) => {
    const stored = sessionStorage.getItem("twincode_utm");
    let storedAttribution = {};
    try {
      storedAttribution = stored ? JSON.parse(stored) : {};
    } catch {
      storedAttribution = {};
    }
    navigator.sendBeacon?.(
      "/api/notify.php",
      new Blob(
        [JSON.stringify({
          event,
          page: `${location.pathname}${location.search}`.slice(0, 500),
          referrer: document.referrer.slice(0, 500),
          attribution: storedAttribution,
          details: { source },
        })],
        { type: "application/json" },
      ),
    );
  };

  document.querySelectorAll("[data-contact]").forEach((link) => {
    link.addEventListener("click", () => {
      const kind = link.getAttribute("data-contact");
      const target = kind === "phone" ? "phone_click" : kind === "email" ? "email_click" : "contact_click";
      const source = `seo_${document.body.dataset.service || "service"}_${kind}`;
      window.ym(METRIKA_ID, "reachGoal", target, { ...attribution, source });
      notify(target, source);
    });
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
