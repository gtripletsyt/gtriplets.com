/*
 * Persistent liquid-glass layout.
 * Pages load inside an iframe without reloading the header and footer.
 */

const EXCLUDED = [
  "/games/drift-boss",
  "/games/gd",
  "/games/flappy"
];

const LINKS = [
  ["/", "home"],
  ["/about", "about"],
  ["/contact", "contact"],
  ["/games", "games"],
  ["/live", "blog"],
  ["/tools", "tools"]
];

const escapeHTML = value =>
  value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const destination = context.request.headers.get("sec-fetch-dest");

  /*
   * Iframe requests receive the original page.
   * This prevents an endless series of nested layouts.
   */
  if (
    destination === "iframe" ||
    destination === "frame" ||
    (destination && destination !== "document") ||
    context.request.method !== "GET" ||
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html") ||
    EXCLUDED.some(path =>
      url.pathname === path ||
      url.pathname.startsWith(path + "/")
    )
  ) {
    return response;
  }

  const headers = new Headers(response.headers);

  [
    "content-length",
    "content-encoding",
    "etag",
    "last-modified"
  ].forEach(name => headers.delete(name));

  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "private, no-store");
  headers.append("vary", "Sec-Fetch-Dest");

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  >

  <title>G Triplets</title>

  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4454994261105400"
    crossorigin="anonymous">
  </script>

  <style>${glassStyles}</style>
</head>

<body>
  <div class="aurora" aria-hidden="true"></div>

  <header id="gt-header" class="glass">
    <a href="/" class="brand" aria-label="G Triplets home">
      <span class="mark">GT</span>

      <span>
        g<span class="accent">triplets</span>
        <small>YOUR NEXT DISCOVERY</small>
      </span>
    </a>

    <nav aria-label="Main navigation">
      ${LINKS.map(([href, label]) => `
        <a href="${href}">${label}</a>
      `).join("")}
    </nav>

    <span class="signal" aria-hidden="true">
      <i></i>
      EXPLORE
    </span>
  </header>

  <main id="gt-main">
    <div
      id="gt-progress"
      role="status"
      aria-live="polite">
    </div>

    <iframe
      id="gt-content"
      title="G Triplets page content"
      src="${escapeHTML(url.pathname + url.search)}"
      allow="fullscreen; autoplay; clipboard-write"
      allowfullscreen>
    </iframe>
  </main>

  <footer id="gt-footer" class="glass">
    <span>
      © ${new Date().getUTCFullYear()} gtriplets.com
      <span class="rights"> · All rights reserved.</span>
    </span>

    <a href="/">
      ↖ <span>Back home</span>
    </a>
  </footer>

  <div id="gt-error" class="glass" hidden>
    <span>This page is taking longer than expected.</span>

    <button id="gt-retry" type="button">
      Retry
    </button>

    <a
      id="gt-direct"
      href="${escapeHTML(url.pathname + url.search)}"
      target="_blank"
      rel="noopener">
      Open directly ↗
    </a>
  </div>

  <noscript>
    <style>
      #gt-content {
        display: none;
      }
    </style>

    <p class="no-js">
      Enable JavaScript to use the embedded navigation.
    </p>
  </noscript>

  <script>
    (${startShell.toString()})(${JSON.stringify(EXCLUDED)});
  </script>
</body>
</html>`,
    {
      status: response.status,
      headers
    }
  );
}

function startShell(excluded) {
  const frame = document.getElementById("gt-content");
  const progress = document.getElementById("gt-progress");
  const error = document.getElementById("gt-error");
  const direct = document.getElementById("gt-direct");

  let pending = new URL(location.href);
  let timeout;
  let firstLoad = true;

  const isExcluded = pathname =>
    excluded.some(path =>
      pathname === path ||
      pathname.startsWith(path + "/")
    );

  const key = url =>
    url.pathname + url.search + url.hash;

  function highlight(url) {
    document.querySelectorAll("nav a").forEach(link => {
      const pathname =
        url.pathname.replace(/\/+$/, "") || "/";

      const active =
        pathname === link.pathname ||
        (
          link.pathname !== "/" &&
          pathname.startsWith(link.pathname + "/")
        );

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function busy() {
    clearTimeout(timeout);

    error.hidden = true;
    frame.setAttribute("aria-busy", "true");

    progress.textContent = "Loading page…";
    progress.classList.add("loading");

    direct.href = pending.href;

    timeout = setTimeout(() => {
      error.hidden = false;
    }, 15000);
  }

  function navigate(url) {
    if (
      url.origin !== location.origin ||
      isExcluded(url.pathname)
    ) {
      location.assign(url.href);
      return;
    }

    pending = url;

    highlight(url);
    busy();

    /*
     * Replace the iframe's history entry so switching sections
     * does not create extra Back-button entries.
     */
    try {
      frame.contentWindow.location.replace(url.href);
    } catch (_) {
      frame.src = url.href;
    }
  }

  function intercept(event) {
    const link = event.target.closest?.("a[href]");

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self") ||
      link.relList.contains("external")
    ) {
      return;
    }

    const url = new URL(
      link.href,
      link.ownerDocument.baseURI
    );

    if (!["http:", "https:"].includes(url.protocol)) {
      return;
    }

    /*
     * External sites and excluded games open normally.
     */
    if (
      url.origin !== location.origin ||
      isExcluded(url.pathname)
    ) {
      event.preventDefault();
      location.assign(url.href);
      return;
    }

    /*
     * Leave file links to the browser.
     */
    if (
      /\.(?:pdf|zip|png|jpe?g|gif|webp|svg|mp4|mp3|txt|csv|docx?|xlsx?|exe|dmg)$/i
        .test(url.pathname)
    ) {
      return;
    }

    event.preventDefault();

    if (key(url) === key(new URL(location.href))) {
      return;
    }

    history.pushState(
      { gt: true },
      "",
      url.href
    );

    navigate(url);
  }

  document
    .getElementById("gt-header")
    .addEventListener("click", intercept);

  document
    .getElementById("gt-footer")
    .addEventListener("click", intercept);

  frame.addEventListener("load", () => {
    clearTimeout(timeout);

    frame.removeAttribute("aria-busy");

    progress.classList.remove("loading");
    progress.textContent = "";

    error.hidden = true;

    try {
      const doc = frame.contentDocument;

      if (!doc) {
        throw new Error("Cross-origin frame");
      }

      const url = new URL(
        frame.contentWindow.location.href
      );

      if (url.href === "about:blank") {
        return;
      }

      if (isExcluded(url.pathname)) {
        location.assign(url.href);
        return;
      }

      /*
       * Preserve an anchor from the initial address.
       */
      if (firstLoad && location.hash) {
        url.hash = location.hash;
        frame.contentWindow.location.replace(url.href);
      }

      firstLoad = false;
      pending = url;

      history.replaceState(
        { gt: true },
        "",
        url.href
      );

      highlight(url);

      document.title = doc.title || "G Triplets";

      frame.title =
        (doc.title || "G Triplets") +
        " — page content";

      /*
       * Links inside the loaded page also use the persistent layout.
       */
      doc.addEventListener("click", intercept);

      frame.contentWindow.addEventListener(
        "hashchange",
        () => {
          history.replaceState(
            { gt: true },
            "",
            frame.contentWindow.location.href
          );
        }
      );

      const secret = doc.getElementById("secret");

      if (secret) {
        secret.style.display = "none";
      }
    } catch (_) {
      error.querySelector("span").textContent =
        "This page cannot be displayed here.";

      error.hidden = false;
    }
  });

  window.addEventListener("popstate", () => {
    navigate(new URL(location.href));
  });

  document
    .getElementById("gt-retry")
    .addEventListener("click", () => {
      navigate(pending);
    });

  highlight(pending);
  busy();
}

const glassStyles = `
  :root {
    color-scheme: dark;
    --ink: #eff7ff;
    --cyan: #9ef4ff;
    --edge: rgba(255, 255, 255, 0.22);

    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #090e1c;
    color: var(--ink);

    height: 100vh;
    height: 100dvh;

    display: flex;
    flex-direction: column;

    padding:
      16px
      20px
      calc(12px + env(safe-area-inset-bottom));

    gap: 12px;
    overflow: hidden;
  }

  .aurora {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;

    background:
      radial-gradient(
        ellipse at 8% 0%,
        #2b626b88,
        transparent 48%
      ),
      radial-gradient(
        ellipse at 90% 12%,
        #7460b377,
        transparent 48%
      ),
      radial-gradient(
        ellipse at 65% 110%,
        #175d6e88,
        transparent 50%
      ),
      #090e1c;
  }

  .glass {
    background: linear-gradient(
      125deg,
      #ffffff20,
      #ffffff08 48%,
      #c4d6ff15
    );

    border: 1px solid var(--edge);

    box-shadow:
      inset 0 1px 0 #ffffff45,
      inset 0 -1px 0 #ffffff0a,
      0 12px 40px #00000038;

    -webkit-backdrop-filter: blur(28px) saturate(160%);
    backdrop-filter: blur(28px) saturate(160%);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  #gt-header {
    position: relative;
    flex-shrink: 0;

    min-height: 78px;
    border-radius: 25px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 12px 22px;
    gap: 20px;

    isolation: isolate;
  }

  #gt-header::before {
    content: "";

    position: absolute;
    top: 0;
    left: 8%;
    right: 8%;

    height: 1px;

    background: linear-gradient(
      90deg,
      transparent,
      #e0ffff,
      transparent
    );

    opacity: 0.8;
    pointer-events: none;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 11px;

    font-size: 21px;
    font-weight: 750;
    letter-spacing: -0.8px;
  }

  .accent {
    color: var(--cyan);
  }

  .brand small {
    display: block;

    font-size: 8px;
    font-weight: 500;
    letter-spacing: 2.5px;

    color: #c0cada;
    margin-top: 3px;
  }

  .mark {
    display: grid;
    place-items: center;

    width: 43px;
    height: 43px;

    font-size: 15px;
    letter-spacing: -1px;

    border-radius: 15px;
    border: 1px solid #ddffff66;

    background: linear-gradient(
      135deg,
      #ddffff50,
      #83c9ed15 55%,
      #a791e944
    );

    box-shadow:
      inset 0 1px 5px #ffffff55,
      0 4px 20px #8defff16;
  }

  nav {
    display: flex;
    gap: 4px;
    padding: 5px;

    background: #02081635;
    border: 1px solid #ffffff0d;
    border-radius: 999px;
  }

  nav a {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 40px;
    padding: 0 17px;

    border: 1px solid transparent;
    border-radius: 999px;

    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;

    color: #c3ccdc;

    transition:
      background 0.2s,
      color 0.2s,
      box-shadow 0.2s;
  }

  nav a:hover {
    color: white;
    background: #ffffff14;
  }

  nav a.active {
    color: #edffff;

    background: linear-gradient(
      145deg,
      #d2ffff3b,
      #97b8ed16
    );

    border-color: #dcffff55;

    box-shadow:
      inset 0 1px 1px #ffffff55,
      0 3px 16px #8dedff15;

    text-shadow: 0 0 15px #a8f8ff66;
  }

  .signal {
    display: flex;
    align-items: center;
    gap: 8px;

    font-size: 9px;
    letter-spacing: 2px;
    color: #c0cddc;
  }

  .signal i {
    width: 5px;
    height: 5px;
    border-radius: 50%;

    background: #a2f7d7;
    box-shadow: 0 0 10px #a2f7d7;
  }

  #gt-main {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    border: 1px solid #ffffff25;
    border-radius: 22px;
    background: #0d1322;

    box-shadow: 0 15px 50px #00000030;
  }

  #gt-content {
    display: block;
    width: 100%;
    height: 100%;

    border: 0;
    background: white;
  }

  #gt-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;

    height: 3px;
    z-index: 2;
    font-size: 0;

    pointer-events: none;
  }

  #gt-progress.loading::after {
    content: "";
    display: block;

    width: 35%;
    height: 100%;

    background: linear-gradient(
      90deg,
      transparent,
      #a0f9ff,
      #c8b6ff,
      transparent
    );

    animation: loading 1.4s ease-in-out infinite;
  }

  @keyframes loading {
    from {
      transform: translateX(-100%);
    }

    to {
      transform: translateX(390%);
    }
  }

  #gt-footer {
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;
    min-height: 44px;

    border-radius: 17px;
    padding: 7px 17px;

    font-size: 10px;
    letter-spacing: 0.3px;
    color: #bfccdc;
  }

  #gt-footer a {
    border: 1px solid #ffffff28;
    background: #ffffff0a;

    padding: 7px 12px;
    border-radius: 999px;

    color: #e3faff;
  }

  #gt-footer a:hover {
    background: #ffffff20;
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--cyan);
    outline-offset: 3px;
  }

  #gt-error {
    position: fixed;
    bottom: 80px;
    left: 50%;

    transform: translateX(-50%);

    max-width: 90vw;
    width: max-content;

    padding: 14px 18px;
    border-radius: 18px;

    background: #172333ed;
    font-size: 12px;

    z-index: 5;
  }

  #gt-error[hidden] {
    display: none;
  }

  #gt-error button,
  #gt-error a {
    display: inline-block;
    margin: 5px;

    color: #d8fbff;
    background: #ffffff12;

    border: 1px solid #ffffff35;
    padding: 7px 10px;
    border-radius: 9px;

    cursor: pointer;
    font: inherit;
  }

  .no-js {
    position: fixed;
    top: 45%;
    left: 10%;
    right: 10%;

    text-align: center;
  }

  @media (min-width: 1400px) {
    body {
      padding-left: 32px;
      padding-right: 32px;
    }

    #gt-header {
      padding-left: 26px;
      padding-right: 26px;
    }
  }

  @media (max-width: 1000px) {
    .signal {
      display: none;
    }

    nav a {
      padding: 0 13px;
    }
  }

  @media (max-width: 720px) {
    body {
      padding:
        10px
        9px
        calc(9px + env(safe-area-inset-bottom));

      gap: 9px;
    }

    #gt-header {
      flex-direction: column;
      gap: 11px;

      padding: 12px 10px;
      border-radius: 22px;
    }

    .brand {
      font-size: 19px;
    }

    .brand small {
      font-size: 7px;
    }

    .mark {
      width: 35px;
      height: 35px;
      border-radius: 12px;
    }

    nav {
      width: 100%;
      justify-content: center;

      padding: 4px;
      gap: 2px;
    }

    nav a {
      flex: 1;
      padding: 0 5px;

      font-size: 9px;
      letter-spacing: 0.4px;

      min-height: 37px;
    }

    #gt-main {
      border-radius: 17px;
    }

    #gt-footer {
      padding: 7px 11px;
      font-size: 9px;
    }

    .rights {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }

    #gt-progress.loading::after {
      animation: none;
      width: 100%;
    }
  }
`;
