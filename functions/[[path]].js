
const EXCLUDED = ['/games/drift-boss', '/games/gd', '/games/flappy'];
const LINKS = [['/', 'home'], ['/about', 'about'], ['/contact', 'contact'], ['/games', 'games'], ['/live', 'blog'], ['/tools', 'tools']];
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
  <a class="brand" href="/" aria-label="G Triplets home"><span class="mark">GT</span><span>g<span class="brand-light">triplets</span></span></a>
  <nav aria-label="Main navigation">${LINKS.map(([href,label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
  <span class="signal" aria-hidden="true"><i></i>EXPLORE</span>
</header>
<main id="gt-main"><div id="gt-progress" role="status" aria-live="polite"></div>
<iframe id="gt-content" title="G Triplets page content" src="${path}" allow="fullscreen; autoplay; clipboard-write" allowfullscreen></iframe></main>
<footer id="gt-footer" class="glass"><span>© ${new Date().getUTCFullYear()} gtriplets.com<span class="rights"> · All rights reserved.</span></span><a href="/">↖ Back home</a></footer>
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
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f5f5;background:#000}
*{box-sizing:border-box}body{margin:0;height:100vh;height:100dvh;display:flex;flex-direction:column;gap:9px;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow:hidden;background:#000}
a{color:inherit;text-decoration:none}.ambience{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 20% -10%,#ffffff16,transparent 48%),radial-gradient(ellipse at 90% 110%,#ffffff0c,transparent 45%),#000}
.glass{--shine-x:50%;position:relative;isolation:isolate;border:1px solid #ffffff30;background:linear-gradient(180deg,#ffffff19 0%,#ffffff08 43%,#000000c9 51%,#ffffff08 100%),#080808d9;box-shadow:inset 0 1px 0 #ffffff75,inset 0 2px 4px #ffffff16,inset 0 -1px 0 #ffffff26,inset 1px 0 0 #ffffff12,inset -1px 0 0 #ffffff12,0 6px 22px #000c,0 0 0 1px #000;-webkit-backdrop-filter:blur(40px) saturate(0%) contrast(120%);backdrop-filter:blur(40px) saturate(0%) contrast(120%)}
.glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at var(--shine-x) 0%,#ffffff25,transparent 55%),linear-gradient(115deg,transparent 15%,#ffffff08 25%,transparent 36%,transparent 65%,#ffffff06 73%,transparent 85%)}
.glass::after{content:"";position:absolute;top:0;left:9%;right:9%;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,#fff9 35%,#fffd 50%,#fff6 65%,transparent)}
#gt-header{flex-shrink:0;min-height:50px;border-radius:17px;display:flex;align-items:center;justify-content:space-between;padding:6px 14px;gap:16px}
.brand{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:750;letter-spacing:-.7px;white-space:nowrap}.brand-light{color:#d5d5d5}.mark{display:grid;place-items:center;width:29px;height:29px;border-radius:10px;font-size:10px;letter-spacing:-.5px;border:1px solid #ffffff55;background:linear-gradient(145deg,#fff4,#fff1 40%,#000 65%,#fff2);box-shadow:inset 0 1px 2px #fff7,0 2px 9px #000}
nav{display:flex;gap:3px;padding:3px;border-radius:999px;border:1px solid #ffffff14;background:#0007;box-shadow:inset 0 2px 5px #0009,0 1px 0 #ffffff12}
nav a{min-height:29px;display:flex;align-items:center;justify-content:center;padding:0 15px;border-radius:999px;border:1px solid transparent;color:#a8a8a8;font-size:10px;font-weight:650;letter-spacing:1px;text-transform:uppercase;transition:background .18s,color .18s,box-shadow .18s}
nav a:hover{color:#fff;background:#ffffff13}nav a.active{color:#fff;border-color:#ffffff48;background:linear-gradient(180deg,#ffffff35,#ffffff12 48%,#0008 51%,#ffffff15);box-shadow:inset 0 1px 1px #ffffff80,inset 0 -1px 1px #ffffff15,0 2px 8px #0009;text-shadow:0 0 12px #fff6}
.signal{display:flex;align-items:center;gap:7px;color:#777;font-size:8px;letter-spacing:2px}.signal i{width:4px;height:4px;background:#ddd;border-radius:50%;box-shadow:0 0 8px #fff9}
#gt-main{position:relative;flex:1;min-height:0;overflow:hidden;border:1px solid #ffffff20;border-radius:16px;background:#050505;box-shadow:0 0 0 1px #000,0 10px 35px #0009}
#gt-content{display:block;width:100%;height:100%;border:0;background:#000;color-scheme:normal}
#gt-progress{position:absolute;inset:0 0 auto;height:2px;z-index:2;font-size:0;pointer-events:none;overflow:hidden}#gt-progress.loading::after{content:"";display:block;width:35%;height:100%;background:linear-gradient(90deg,transparent,#fff,#bcbcbc,transparent);box-shadow:0 0 9px #fff;animation:loading 1.3s ease-in-out infinite}@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(390%)}}
#gt-footer{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px;border-radius:12px;padding:4px 12px;font-size:9px;letter-spacing:.3px;color:#999}#gt-footer a{padding:4px 10px;border:1px solid #ffffff25;border-radius:999px;background:linear-gradient(#ffffff14,#0008);box-shadow:inset 0 1px 0 #ffffff20;color:#ddd}#gt-footer a:hover{background:#ffffff20;color:#fff}
a:focus-visible,button:focus-visible{outline:2px solid #fff;outline-offset:3px}#gt-error{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);max-width:92vw;width:max-content;padding:12px 15px;border-radius:15px;background:#090909f5;font-size:12px;z-index:5}#gt-error[hidden]{display:none}#gt-error button,#gt-error a{display:inline-block;margin:5px;padding:7px 10px;color:#fff;background:#ffffff12;border:1px solid #ffffff35;border-radius:8px;font:inherit;cursor:pointer}noscript{position:relative}
@media(min-width:1400px){body{padding-left:22px;padding-right:22px}}@media(max-width:1000px){.signal{display:none}nav a{padding:0 12px}}
@media(max-width:620px){body{gap:7px;padding-left:max(7px,env(safe-area-inset-left));padding-right:max(7px,env(safe-area-inset-right))}#gt-header{padding:7px 8px;gap:7px;flex-wrap:wrap;border-radius:15px}.brand{font-size:15px}.mark{width:25px;height:25px;border-radius:8px}nav{flex:1;min-width:265px;gap:0;padding:2px}nav a{flex:1;padding:0 7px;font-size:8px;letter-spacing:.3px;min-height:28px}#gt-main{border-radius:12px}.rights{display:none}#gt-footer{font-size:8px;min-height:31px}}
@media(max-width:410px){#gt-header{justify-content:center}nav{width:100%;min-width:0;flex-basis:100%}.brand{font-size:14px}.mark{width:22px;height:22px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}#gt-progress.loading::after{animation:none;width:100%}}
`;
