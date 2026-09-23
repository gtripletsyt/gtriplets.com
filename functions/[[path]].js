const EXCLUDED = ['/games/drift-boss', '/games/gd', '/games/flappy'];
const LINKS = [['/', 'home'], ['/about', 'about'], ['/contact', 'contact'], ['/games', 'games'], ['/live', 'blog'], ['/tools', 'tools']];

// Inline SVG icons stay crisp without a font or external icon library.
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  games: '<path d="M7 6h10c3 0 4 4 4 9 0 3-2 4-4 1l-1-1H8l-1 1c-2 3-4 2-4-1 0-5 1-9 4-9Z"/><path d="M6 10h5M8.5 7.5v5M16 10h.01M18 12h.01"/>',
  blog: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tools: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.home}</svg>`;

const ADS_CLIENT = 'ca-pub-4454994261105400';
const DIRECT = '__gt_direct';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const destination = context.request.headers.get('sec-fetch-dest');
  // Fail safely for older clients without Fetch Metadata: serve the original.
  if (destination !== 'document' || context.request.method !== 'GET' ||
      url.searchParams.has(DIRECT) || !response.ok || response.status === 204 ||
      response.status === 205 || response.status === 206 ||
      response.headers.has('content-disposition') ||
      !response.headers.get('content-type')?.toLowerCase().includes('text/html') ||
      EXCLUDED.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) return response;

  const headers = new Headers(response.headers);
  ['content-length', 'content-encoding', 'etag', 'last-modified', 'content-md5', 'digest'].forEach(h => headers.delete(h));
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'private, no-store');
  headers.append('vary', 'Sec-Fetch-Dest');
  const path = escapeHTML(url.pathname + url.search);
  const direct = new URL(url); direct.searchParams.set(DIRECT, '1');
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>G Triplets</title>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}" crossorigin="anonymous"></script>
<style>${glassStyles}</style></head><body>
<div class="ambience" aria-hidden="true"></div>
<header id="gt-header" class="glass">
  <a class="brand" href="/" aria-label="G Triplets home"><span class="orb" aria-hidden="true"><i></i></span><span>G Triplets</span></a>
  <nav aria-label="Main navigation">${LINKS.map(([href,label]) => `<a href="${href}">${icon(label)}<span>${label[0].toUpperCase() + label.slice(1)}</span></a>`).join('')}</nav>
</header>
<main id="gt-main"><div id="gt-progress" role="status" aria-live="polite"></div>
<iframe id="gt-content" title="G Triplets page content" src="${path}" allow="fullscreen; autoplay; clipboard-write" allowfullscreen></iframe></main>
<footer id="gt-footer" class="glass"><span>© ${new Date().getUTCFullYear()} gtriplets.com<span class="rights"> · All rights reserved.</span></span><a href="/">${icon("home")}<span>Back home</span></a></footer>
<div id="gt-error" class="glass" hidden><span id="gt-error-text">This page is taking longer than expected.</span><button id="gt-retry" type="button">Retry</button><a id="gt-direct" href="${escapeHTML(direct.href)}" target="_top">Open directly ↗</a></div>
<noscript><style>#gt-main{display:none}</style><p>JavaScript is disabled. <a href="${escapeHTML(direct.href)}">Open the original page ↗</a></p></noscript>
<script>(${startShell.toString()})(${JSON.stringify(EXCLUDED)},${JSON.stringify(DIRECT)});</script>
</body></html>`, {status: response.status, headers});
}

function startShell(excluded, directParam) {
  const frame = document.getElementById('gt-content');
  const progress = document.getElementById('gt-progress');
  const error = document.getElementById('gt-error');
  const errorText = document.getElementById('gt-error-text');
  const direct = document.getElementById('gt-direct');
  let pending = new URL(location.href), timeout, firstLoad = true;
  const key = u => u.pathname + u.search + u.hash;
  const isExcluded = p => excluded.some(x => p === x || p.startsWith(x + '/'));
  function highlight(url) {
    const path = url.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('#gt-header nav a').forEach(a => {
      const active = path === a.pathname || (a.pathname !== '/' && path.startsWith(a.pathname + '/'));
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function idle() {
    clearTimeout(timeout); frame.removeAttribute('aria-busy');
    progress.classList.remove('loading'); progress.textContent = ''; error.hidden = true;
  }
  function busy() {
    clearTimeout(timeout); error.hidden = true;
    errorText.textContent = 'This page is taking longer than expected.';
    const raw = new URL(pending); raw.searchParams.set(directParam, '1'); direct.href = raw.href;
    frame.setAttribute('aria-busy', 'true'); progress.textContent = 'Loading page…'; progress.classList.add('loading');
    timeout = setTimeout(() => { error.hidden = false; }, 15000);
  }
  function navigate(url) {
    if (url.origin !== location.origin || isExcluded(url.pathname) || url.searchParams.has(directParam)) { location.assign(url.href); return; }
    pending = url; highlight(url); busy();
    try {
      const current = new URL(frame.contentWindow.location.href);
      // Same-document anchors do not fire the iframe load event.
      const anchorOnly = current.pathname === url.pathname && current.search === url.search && current.hash !== url.hash;
      frame.contentWindow.location.replace(url.href);
      if (anchorOnly) idle();
    } catch (_) { frame.src = url.href; }
  }
  function intercept(event) {
    const a = event.target.closest?.('a[href]');
    if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.hasAttribute('download') || (a.target && a.target !== '_self') || a.relList.contains('external')) return;
    const url = new URL(a.href, a.ownerDocument.baseURI);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin !== location.origin || isExcluded(url.pathname) || url.searchParams.has(directParam)) { event.preventDefault(); location.assign(url.href); return; }
    if (/\.(?:pdf|zip|png|jpe?g|gif|webp|svg|mp4|mp3|txt|csv|docx?|xlsx?|exe|dmg)$/i.test(url.pathname)) return;
    event.preventDefault();
    if (key(url) === key(new URL(location.href))) return;
    history.pushState({gt:true}, '', url.href); navigate(url);
  }
  document.getElementById('gt-header').addEventListener('click', intercept);
  document.getElementById('gt-footer').addEventListener('click', intercept);
  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument;
      if (!doc) throw new Error('Frame unavailable');
      const url = new URL(frame.contentWindow.location.href);
      if (url.href === 'about:blank') return;
      if (isExcluded(url.pathname)) { location.assign(url.href); return; }
      if (firstLoad && location.hash) { url.hash = location.hash; frame.contentWindow.location.replace(url.href); }
      firstLoad = false; idle(); pending = url;
      history.replaceState({gt:true}, '', url.href); highlight(url);
      document.title = doc.title || 'G Triplets'; frame.title = document.title + ' — page content';
      doc.addEventListener('click', intercept);
      frame.contentWindow.addEventListener('hashchange', () => {
        const current = new URL(frame.contentWindow.location.href);
        pending = current; history.replaceState({gt:true}, '', current.href); idle();
      });
      const secret = doc.getElementById('secret'); if (secret) secret.style.display = 'none';
    } catch (_) { idle(); errorText.textContent = 'This page cannot be displayed here.'; error.hidden = false; }
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href)));
  document.getElementById('gt-retry').addEventListener('click', () => navigate(pending));
  // Pointer-following silver reflection; no animation loop or layout measurements.
  if (matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches) {
    document.querySelectorAll('header.glass,footer.glass').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--shine-x', ((e.clientX-r.left)/r.width*100)+'%'); });
      el.addEventListener('pointerleave', () => el.style.setProperty('--shine-x', '50%'));
    });
  }
  highlight(pending); busy();
}

const glassStyles = `
:root{color-scheme:dark;font-family:Arial,Helvetica,ui-sans-serif,system-ui,sans-serif;color:#f5f5f5;background:#090909}
*{box-sizing:border-box}
body{margin:0;height:100vh;height:100dvh;display:flex;flex-direction:column;align-items:center;gap:12px;padding:max(8px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow:hidden;background:#090909}
a{color:inherit;text-decoration:none}svg{display:block;width:17px;height:17px;flex-shrink:0}
.ambience{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse 650px 170px at 50% 0%,#ffffff09,transparent),radial-gradient(ellipse 550px 90px at 50% 100%,#ffffff05,transparent),#090909}
/* The curved highlight is brightest along the top-left bevel, like the reference. */
.glass{--shine-x:34%;position:relative;isolation:isolate;border:1px solid transparent;background:linear-gradient(112deg,#292929ee 0%,#141414f5 40%,#030303fa 100%) padding-box,linear-gradient(165deg,#979797 0%,#5b5b5b 25%,#363636 55%,#181818 82%,#393939) border-box;box-shadow:inset 0 1px 0 #ffffff13,inset 0 -1px 0 #000c,0 9px 24px #0009,0 22px 48px #0005;-webkit-backdrop-filter:blur(28px);backdrop-filter:blur(28px)}
.glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at var(--shine-x) 0%,#ffffff09,transparent 62%)}
#gt-header{flex-shrink:0;max-width:100%;width:max-content;min-height:54px;border-radius:17px;display:flex;align-items:center;justify-content:center;padding:7px 12px;gap:12px;z-index:3}
.brand{display:flex;align-items:center;gap:11px;padding:0 19px 0 10px;min-height:24px;border-right:1px solid #ffffff1c;font-size:14px;font-weight:600;white-space:nowrap;letter-spacing:-.15px}
.orb{position:relative;display:grid;place-items:center;width:17px;height:17px;flex-shrink:0}
.orb::before,.orb::after{content:"";position:absolute;inset:2px;border:1px solid #79dcf4;border-radius:5px;transform:rotate(45deg);box-shadow:inset 0 0 5px #69bfff40,0 0 6px #71bfff15}
.orb::after{inset:4px;border-color:#6683ed;transform:rotate(15deg);border-radius:50%}.orb i{height:4px;width:4px;border-radius:50%;background:#c9edff;box-shadow:0 0 5px #89caff}
nav{display:flex;align-items:center;gap:5px;min-width:0}
nav a{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 12px;border:1px solid transparent;border-radius:12px;font-size:14px;font-weight:400;color:#a5a5a5;white-space:nowrap;transition:color .18s,background .18s,box-shadow .18s;}
nav a:hover{color:#eee;background:#ffffff0b}
nav a.active{color:#fff;border-color:#dadada;background:linear-gradient(180deg,#aaa 0%,#8a8a8a 17%,#727272 60%,#626262 100%);box-shadow:inset 0 1px 1px #ffffffe0,inset 0 -1px 1px #ffffff26,inset 1px 0 1px #ffffff38,inset -1px 0 1px #ffffff38,0 0 0 1px #ffffff10,0 0 17px #ffffff20,0 4px 10px #0008;text-shadow:0 1px 2px #0005}
nav a.active svg{filter:drop-shadow(0 1px 1px #0003)}
#gt-main{position:relative;flex:1;align-self:stretch;min-height:0;overflow:hidden;border:1px solid #ffffff10;border-radius:14px;background:#080808;box-shadow:0 5px 20px #0004}
#gt-content{display:block;width:100%;height:100%;border:0;background:#090909;color-scheme:normal}
#gt-progress{position:absolute;inset:0 0 auto;height:2px;z-index:2;font-size:0;pointer-events:none;overflow:hidden}#gt-progress.loading::after{content:"";display:block;width:35%;height:100%;background:linear-gradient(90deg,transparent,#ddd,transparent);animation:loading 1.3s ease-in-out infinite}@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(390%)}}
#gt-footer{flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:18px;max-width:100%;min-height:36px;border-radius:12px;padding:5px 15px;color:#929292;font-size:10px}
#gt-footer a{display:flex;align-items:center;gap:6px;border-left:1px solid #ffffff1c;padding:2px 0 2px 16px;color:#bbb;font-size:11px}#gt-footer a:hover{color:#fff}#gt-footer svg{width:13px;height:13px}
a:focus-visible,button:focus-visible{outline:2px solid #eee;outline-offset:3px}
#gt-error{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);max-width:92vw;width:max-content;padding:12px 15px;border-radius:15px;background:#151515;font-size:12px;z-index:5}#gt-error[hidden]{display:none}#gt-error button,#gt-error a{display:inline-block;margin:5px;padding:7px 10px;color:#fff;background:#ffffff12;border:1px solid #ffffff35;border-radius:8px;font:inherit;cursor:pointer}noscript{position:relative}
@media(max-width:780px){#gt-header{gap:8px;padding-left:9px;padding-right:9px}.brand{padding-left:5px;padding-right:12px;font-size:13px;gap:8px}nav{gap:2px}nav a{font-size:12px;padding:0 9px;gap:5px}nav svg{width:15px;height:15px}}
@media(max-width:650px){body{gap:9px;padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}#gt-header{width:100%;flex-direction:column;gap:7px;padding:9px 7px 7px;border-radius:16px}.brand{border-right:0;padding:0;font-size:13px;min-height:19px}nav{width:100%;justify-content:center;gap:3px}nav a{flex:1;padding:0 5px;gap:5px;min-height:34px;font-size:11px;border-radius:10px}nav svg{width:14px;height:14px}.rights{display:none}#gt-footer{min-height:33px;gap:12px;font-size:9px}#gt-footer a{font-size:10px;padding-left:12px}#gt-main{border-radius:10px}}
@media(max-width:380px){nav a{font-size:10px;gap:3px;padding:0 3px}nav svg{width:12px;height:12px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}#gt-progress.loading::after{animation:none;width:100%}}
`;
