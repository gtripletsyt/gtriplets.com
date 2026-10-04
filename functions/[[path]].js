const EXCLUDED = ['/games/drift-boss', '/games/gd', '/games/flappy'];
const LINKS = [['/about', 'about'], ['/games', 'games'], ['/live', 'blog'], ['/updates', 'changelog'], ['/tools', 'tools']];

// Inline SVG icons stay crisp without a font or external icon library.
const ICONS = {
  back: '<path d="m15 18-6-6 6-6M9 12h12"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  games: '<path d="M7 6h10c3 0 4 4 4 9 0 3-2 4-4 1l-1-1H8l-1 1c-2 3-4 2-4-1 0-5 1-9 4-9Z"/><path d="M6 10h5M8.5 7.5v5M16 10h.01M18 12h.01"/>',
  blog: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tools: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.home}</svg>`;

const DIRECT = '__gt_direct';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const destination = context.request.headers.get('sec-fetch-dest');
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
<title>gtrip's site</title>
<style>${glassStyles}</style></head><body>
<header id="gt-header" class="glass">
  <span class="glass-backdrop" aria-hidden="true"></span>
  <button id="gt-back" type="button" aria-label="Go back" title="Go back">${icon('back')}</button>
  <a class="brand" href="/" aria-label="G Triplets home"><span class="orb" aria-hidden="true"><i></i></span><span>gtriplets</span></a>
  <nav aria-label="Main navigation"><span id="gt-nav-lens" aria-hidden="true" hidden></span>${LINKS.map(([href,label]) => `<a href="${href}">${icon(label)}<span>${label[0].toUpperCase() + label.slice(1)}</span></a>`).join('')}</nav>
</header>
<main id="gt-main"><div id="gt-progress" role="status" aria-live="polite"></div>
<iframe id="gt-content" title="G Triplets page content" src="${path}" allow="fullscreen; autoplay; clipboard-write" allowfullscreen></iframe></main>
<footer id="gt-footer" class="glass"><span class="glass-backdrop" aria-hidden="true"></span><span>Â© ${new Date().getUTCFullYear()} gtriplets.com<span class="rights"> Â· All rights reserved.</span></span><a href="/">${icon("home")}<span>Back home</span></a></footer>
<div id="gt-error" class="glass" hidden><span class="glass-backdrop" aria-hidden="true"></span><span id="gt-error-text">This page is taking longer than expected.</span><button id="gt-retry" type="button">Retry</button><a id="gt-direct" href="${escapeHTML(direct.href)}" target="_top">Open directly â†—</a></div>
<noscript><style>#gt-main{display:none}</style><p>JavaScript is disabled. <a href="${escapeHTML(direct.href)}">Open the original page â†—</a></p></noscript>
<script>(${startShell.toString()})(${JSON.stringify(EXCLUDED)},${JSON.stringify(DIRECT)},${startGlass.toString()});</script>
</body></html>`, {status: response.status, headers});
}

function startShell(excluded, directParam, startGlass) {
  const frame = document.getElementById('gt-content');
  const progress = document.getElementById('gt-progress');
  const error = document.getElementById('gt-error');
  const errorText = document.getElementById('gt-error-text');
  const direct = document.getElementById('gt-direct');
  const navLens = document.getElementById('gt-nav-lens');
  const header = document.getElementById('gt-header');
  const footer = document.getElementById('gt-footer');
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
    syncNavLens();
  }
  function syncNavLens() {
    const active = header.querySelector('nav a.active');
    navLens.hidden = !active;
    if (!active) return;
    navLens.style.width = active.offsetWidth + 'px';
    navLens.style.height = active.offsetHeight + 'px';
    navLens.style.transform = 'translate3d(' + active.offsetLeft + 'px,' + active.offsetTop + 'px,0)';
  }
  // The page fills the viewport behind the glass. Reserve space for ordinary
  // page content without changing the iframe's viewport or scrolling behavior.
  let insetDoc, insetStyle;
  function syncPageInsets(doc = insetDoc) {
    if (!doc?.body) return;
    if (doc !== insetDoc) {
      insetDoc = doc;
      insetStyle = doc.createElement('style');
      insetStyle.id = 'gt-shell-insets';
      (doc.head || doc.documentElement).appendChild(insetStyle);
    }
    // Read the page's own responsive padding with our rule temporarily disabled.
    insetStyle.disabled = true;
    const style = frame.contentWindow.getComputedStyle(doc.body);
    const baseTop = parseFloat(style.paddingTop) || 0;
    const baseBottom = parseFloat(style.paddingBottom) || 0;
    const color = style.backgroundColor;
    const rootColor = frame.contentWindow.getComputedStyle(doc.documentElement).backgroundColor;
    insetStyle.disabled = false;
    const top = Math.ceil(header.getBoundingClientRect().bottom + 16);
    const bottom = Math.ceil(innerHeight - footer.getBoundingClientRect().top + 16);
    insetStyle.textContent = ':root{--gt-shell-top:' + top + 'px;--gt-shell-bottom:' + bottom +
      'px;scroll-padding-top:var(--gt-shell-top);scroll-padding-bottom:var(--gt-shell-bottom)}' +
      'body{box-sizing:border-box!important;padding-top:calc(' + baseTop + 'px + var(--gt-shell-top))!important;' +
      'padding-bottom:calc(' + baseBottom + 'px + var(--gt-shell-bottom))!important}';
    // Light pages need dark labels; transparent pages inherit the dark shell.
    const opaque = c => {
      const values = c.match(/[\d.]+/g)?.map(Number);
      return values && values.length >= 3 && (values.length === 3 || values[3] >= .5) ? values : null;
    };
    const rgb = opaque(color) || opaque(rootColor);
    document.documentElement.dataset.pageTone = rgb && (.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]) > 155 ? 'light' : 'dark';
  }
  function idle() {
    clearTimeout(timeout); frame.removeAttribute('aria-busy');
    progress.classList.remove('loading'); progress.textContent = ''; error.hidden = true;
  }
  function busy() {
    clearTimeout(timeout); error.hidden = true;
    errorText.textContent = 'This page is taking longer than expected.';
    const raw = new URL(pending); raw.searchParams.set(directParam, '1'); direct.href = raw.href;
    frame.setAttribute('aria-busy', 'true'); progress.textContent = 'Loading pageâ€¦'; progress.classList.add('loading');
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
      syncPageInsets(doc);
      if (firstLoad && location.hash) { url.hash = location.hash; frame.contentWindow.location.replace(url.href); }
      firstLoad = false; idle(); pending = url;
      history.replaceState({gt:true}, '', url.href); highlight(url);
      document.title = doc.title || 'G Triplets'; frame.title = document.title + ' â€” page content';
      doc.addEventListener('click', intercept);
      frame.contentWindow.addEventListener('hashchange', () => {
        const current = new URL(frame.contentWindow.location.href);
        pending = current; history.replaceState({gt:true}, '', current.href); idle();
      });
      const secret = doc.getElementById('secret'); if (secret) secret.style.display = 'none';
    } catch (_) { idle(); errorText.textContent = 'This page cannot be displayed here.'; error.hidden = false; }
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href)));
  document.getElementById('gt-back').addEventListener('click', () => {
    if (history.length > 1) { history.back(); return; }
    const home = new URL('/', location.href);
    history.replaceState({gt:true}, '', home.href);
    navigate(home);
  });
  document.getElementById('gt-retry').addEventListener('click', () => navigate(pending));
  let layoutFrame;
  const syncLayout = () => {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => { syncNavLens(); syncPageInsets(); });
  };
  if (typeof ResizeObserver !== 'undefined') {
    const resize = new ResizeObserver(syncLayout);
    resize.observe(header); resize.observe(footer);
  }
  window.addEventListener('resize', syncLayout, {passive:true});
  if (document.fonts?.ready) document.fonts.ready.then(syncLayout);
  startGlass();
  highlight(pending); busy();
}

// Curved, rounded-rectangle lenses. The red/green channels encode an actual
// displacement field, so page pixels bend at the bevel rather than just blur.
// SVG backdrop refraction is enabled only in Chromium; WebKit/Gecko keep the
// CSS material below. No libraries, page screenshots, or continuous render loop.
function startGlass() {
  const surfaces = [...document.querySelectorAll('#gt-header,#gt-footer')];
  const transparency = matchMedia('(prefers-reduced-transparency: reduce)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const isChromium = /Chrome|Chromium|Edg\//.test(navigator.userAgent) && !/CriOS|EdgiOS|OPiOS/.test(navigator.userAgent);
  const refracts = isChromium && typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url("#gt-lens")');
  const ns = 'http://www.w3.org/2000/svg';
  const node = (name, attrs = {}) => {
    const el = document.createElementNS(ns, name);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    return el;
  };
  let defs;
  if (refracts) {
    const svg = node('svg', {width:0, height:0, 'aria-hidden':'true', focusable:'false'});
    svg.style.cssText = 'position:fixed;pointer-events:none;overflow:hidden';
    defs = node('defs'); svg.appendChild(defs); document.body.appendChild(svg);
  }
  function lensMap(width, height, radius, pad, scale) {
    const resolution = Math.min(devicePixelRatio || 1, 1.5);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil((width + pad * 2) * resolution);
    canvas.height = Math.ceil((height + pad * 2) * resolution);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const map = ctx.createImageData(canvas.width, canvas.height);
    const halfW = width / 2, halfH = height / 2;
    const bevel = Math.min(14, halfH * .7);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const px = (x + .5) / resolution - pad - halfW;
        const py = (y + .5) / resolution - pad - halfH;
        const qx = Math.abs(px) - halfW + radius;
        const qy = Math.abs(py) - halfH + radius;
        const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
        const length = Math.hypot(ax, ay);
        const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
        let dx = 0, dy = 0;
        if (distance <= 0) {
          const nx = length > 0 ? Math.sign(px) * ax / length : qx > qy ? Math.sign(px) : 0;
          const ny = length > 0 ? Math.sign(py) * ay / length : qx > qy ? 0 : Math.sign(py);
          const rim = Math.max(0, 1 + distance / bevel);
          const bend = scale * .38 * rim * rim;
          dx = -nx * bend - px * .008 * (1 - rim);
          dy = -ny * bend - py * .008 * (1 - rim);
        }
        const i = (y * canvas.width + x) * 4;
        map.data[i] = Math.round(255 * (.5 + dx / scale));
        map.data[i + 1] = Math.round(255 * (.5 + dy / scale));
        map.data[i + 2] = 128; map.data[i + 3] = 255;
      }
    }
    ctx.putImageData(map, 0, 0);
    return canvas.toDataURL('image/png');
  }
  const lenses = surfaces.map(el => {
    const layer = el.querySelector('.glass-backdrop');
    if (!refracts) return {el, layer};
    const id = el.id + '-refraction';
    const filter = node('filter', {id, filterUnits:'userSpaceOnUse', primitiveUnits:'userSpaceOnUse', 'color-interpolation-filters':'sRGB'});
    const image = node('feImage', {result:'curve', preserveAspectRatio:'none'});
    filter.appendChild(node('feGaussianBlur', {in:'SourceGraphic', stdDeviation:'.65', result:'scene'}));
    filter.appendChild(image);
    filter.appendChild(node('feDisplacementMap', {in:'scene', in2:'curve', scale:'36', xChannelSelector:'R', yChannelSelector:'G'}));
    defs.appendChild(filter);
    return {el, layer, id, filter, image, size:''};
  });
  function refresh() {
    for (const lens of lenses) {
      if (!refracts || transparency.matches) {
        lens.layer.style.removeProperty('--gt-refraction');
        continue;
      }
      const width = lens.el.offsetWidth, height = lens.el.offsetHeight;
      if (!width || !height) continue;
      const radius = Math.min(parseFloat(getComputedStyle(lens.el).borderTopLeftRadius) || height / 2, width / 2, height / 2);
      const size = [width, height, radius, Math.min(devicePixelRatio || 1, 1.5)].join(':');
      try {
        if (size !== lens.size) {
          const pad = 24;
          for (const target of [lens.filter, lens.image]) {
            target.setAttribute('x', -pad); target.setAttribute('y', -pad);
            target.setAttribute('width', width + pad * 2); target.setAttribute('height', height + pad * 2);
          }
          lens.image.setAttribute('href', lensMap(width, height, radius, pad, 36));
          lens.size = size;
        }
        lens.layer.style.setProperty('--gt-refraction', 'url("#' + lens.id + '") blur(.45px) saturate(1.45)');
      } catch (_) {
        lens.layer.style.removeProperty('--gt-refraction');
      }
    }
  }
  let resizeFrame;
  const queueRefresh = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(refresh);
  };
  if (refracts && typeof ResizeObserver !== 'undefined') {
    const resize = new ResizeObserver(queueRefresh);
    surfaces.forEach(el => resize.observe(el));
  }
  window.addEventListener('resize', queueRefresh, {passive:true});
  transparency.addEventListener?.('change', queueRefresh);
  surfaces.forEach(el => {
    let shineFrame;
    el.addEventListener('pointermove', event => {
      if (motion.matches || event.pointerType === 'touch') return;
      cancelAnimationFrame(shineFrame);
      shineFrame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        el.style.setProperty('--shine-x', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--shine-y', (y * 100).toFixed(1) + '%');
        el.style.setProperty('--light-angle', (120 + (x - .5) * 45) + 'deg');
      });
    }, {passive:true});
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(shineFrame);
      ['--shine-x','--shine-y','--light-angle'].forEach(name => el.style.removeProperty(name));
    });
  });
  refresh();
}

const glassStyles = `
:root{color-scheme:dark;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:#090909;color:#f5f7fa;--glass-ink:#f4f7fc;--glass-muted:#d5dce7;--glass-fill:rgba(12,17,25,.24);--glass-line:rgba(255,255,255,.22);--glass-text-shadow:0 1px 3px rgba(0,0,0,.5);--selected-fill:rgba(255,255,255,.12)}
:root[data-page-tone="light"]{--glass-ink:#172332;--glass-muted:#314052;--glass-fill:rgba(255,255,255,.2);--glass-line:rgba(25,40,60,.15);--glass-text-shadow:0 1px 2px rgba(255,255,255,.5);--selected-fill:rgba(255,255,255,.26)}
*{box-sizing:border-box}
body{margin:0;height:100vh;height:100dvh;overflow:hidden;background:#090909}
a{color:inherit;text-decoration:none}svg{display:block;width:17px;height:17px;flex-shrink:0}
/* The material is behind the labels. Only the backdrop is ever distorted. */
.glass{--shine-x:24%;--shine-y:0%;--light-angle:135deg;position:fixed;color:var(--glass-ink);border-radius:999px;background:transparent;box-shadow:0 8px 28px rgba(0,0,0,.2),0 2px 6px rgba(0,0,0,.14),0 0 0 1px rgba(255,255,255,.045);text-shadow:var(--glass-text-shadow)}
.glass-backdrop{position:absolute;inset:0;z-index:0;border-radius:inherit;pointer-events:none;background:linear-gradient(150deg,rgba(255,255,255,.15),rgba(255,255,255,.025) 38%,rgba(255,255,255,.01) 65%,rgba(255,255,255,.095)),var(--glass-fill);-webkit-backdrop-filter:blur(12px) saturate(1.65);backdrop-filter:var(--gt-refraction,blur(12px) saturate(1.65));box-shadow:inset 0 1.5px 1px rgba(255,255,255,.46),inset 0 -1px 1px rgba(255,255,255,.16),inset 1px 0 1px rgba(255,255,255,.2),inset -1px 0 1px rgba(255,255,255,.1)}
.glass::before{content:"";position:absolute;inset:0;z-index:1;border-radius:inherit;pointer-events:none;background:radial-gradient(ellipse 42% 120% at var(--shine-x) var(--shine-y),rgba(255,255,255,.19),transparent 70%),linear-gradient(175deg,rgba(255,255,255,.085),transparent 42%,transparent 72%,rgba(255,255,255,.035))}
.glass::after{content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(var(--light-angle),rgba(255,255,255,.78),rgba(255,255,255,.14) 27%,rgba(255,255,255,.035) 48%,rgba(255,255,255,.15) 72%,rgba(255,255,255,.48));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude}
.glass>:not(.glass-backdrop){position:relative;z-index:2}
#gt-header{top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px - env(safe-area-inset-left) - env(safe-area-inset-right));min-height:60px;padding:8px 10px;display:flex;align-items:center;gap:12px;z-index:10}
.brand{display:flex;align-items:center;gap:10px;padding:0 19px 0 10px;min-height:26px;border-right:1px solid var(--glass-line);font-size:14px;font-weight:650;white-space:nowrap;letter-spacing:-.2px}
#gt-back{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;padding:0;border:1px solid var(--glass-line);border-radius:999px;background:rgba(255,255,255,.055);color:var(--glass-ink);cursor:pointer;transition:background .2s,transform .2s}#gt-back:hover{background:rgba(255,255,255,.14)}#gt-back:active{transform:scale(.94)}#gt-back svg{width:19px;height:19px}
.orb{position:relative;display:grid;place-items:center;width:18px;height:18px;flex-shrink:0}
.orb::before,.orb::after{content:"";position:absolute;inset:2px;border:1px solid #91e3fc;border-radius:5px;transform:rotate(45deg);box-shadow:inset 0 0 5px #69bfff40,0 0 6px #71bfff15}
.orb::after{inset:4px;border-color:#7e9efa;transform:rotate(15deg);border-radius:50%}.orb i{height:4px;width:4px;border-radius:50%;background:#d5f3ff;box-shadow:0 0 5px #89caff}
#gt-header nav{display:flex;align-items:center;gap:3px;min-width:0}
#gt-header nav a{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 14px;border-radius:999px;color:var(--glass-muted);font-size:13px;font-weight:500;white-space:nowrap;transition:background .2s,color .2s,transform .2s}
#gt-header nav a:hover{color:var(--glass-ink);background:rgba(255,255,255,.085)}
#gt-header nav a:active{transform:scale(.96)}
#gt-header nav a.active{color:var(--glass-ink);font-weight:650}
#gt-nav-lens{position:absolute;left:0;top:0;z-index:1;border-radius:999px;pointer-events:none;background:linear-gradient(155deg,rgba(255,255,255,.22),rgba(255,255,255,.035) 52%,rgba(255,255,255,.12)),var(--selected-fill);box-shadow:inset 0 1px 1px rgba(255,255,255,.65),inset 0 -1px 1px rgba(255,255,255,.16),inset 1px 0 1px rgba(255,255,255,.26),inset -1px 0 1px rgba(255,255,255,.2),0 2px 7px rgba(0,0,0,.12),0 0 0 .5px rgba(255,255,255,.2);transition:transform .44s cubic-bezier(.22,1,.36,1),width .44s cubic-bezier(.22,1,.36,1),height .25s}
#gt-nav-lens[hidden]{display:none}
/* Full-viewport content is necessary: glass cannot refract an empty gutter. */
#gt-main{position:fixed;inset:0;z-index:0;overflow:hidden;background:#090909}
#gt-content{display:block;width:100%;height:100%;border:0;background:#090909;color-scheme:normal}
#gt-progress{position:absolute;inset:0 0 auto;height:2px;z-index:2;font-size:0;pointer-events:none;overflow:hidden}#gt-progress.loading::after{content:"";display:block;width:35%;height:100%;background:linear-gradient(90deg,transparent,#e3eeff,transparent);animation:loading 1.3s ease-in-out infinite}@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(390%)}}
#gt-footer{bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:17px;width:max-content;max-width:calc(100% - 24px - env(safe-area-inset-left) - env(safe-area-inset-right));min-height:40px;padding:8px 17px;color:var(--glass-muted);font-size:11px;z-index:10}
#gt-footer a{display:flex;align-items:center;gap:6px;min-height:24px;border-left:1px solid var(--glass-line);padding-left:16px;font-size:11px;white-space:nowrap}#gt-footer a:hover{color:var(--glass-ink)}#gt-footer svg{width:14px;height:14px}
a:focus-visible,button:focus-visible{outline:2px solid var(--glass-ink);outline-offset:3px;border-radius:6px}
#gt-error{bottom:calc(68px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);max-width:92vw;width:max-content;padding:14px 17px;border-radius:22px;font-size:12px;z-index:20;--glass-fill:rgba(12,17,25,.7)}#gt-error[hidden]{display:none}#gt-error button,#gt-error a{display:inline-block;margin:5px;padding:8px 12px;color:var(--glass-ink);background:var(--selected-fill);border:1px solid var(--glass-line);border-radius:999px;font:inherit;cursor:pointer}noscript{position:fixed;inset:100px 20px auto;z-index:30}
@media(max-width:780px){#gt-header{gap:9px}.brand{padding-right:13px;font-size:13px;gap:8px}#gt-header nav a{font-size:12px;padding:0 11px;gap:6px}#gt-header nav svg{width:16px;height:16px}}
@media(max-width:650px){#gt-header{top:max(10px,env(safe-area-inset-top));max-width:calc(100% - 20px - env(safe-area-inset-left) - env(safe-area-inset-right));width:calc(100% - 20px);flex-direction:column;gap:6px;padding:10px 8px 8px;border-radius:30px}.brand{border-right:0;padding:0;min-height:22px;font-size:13px}#gt-header nav{width:100%;justify-content:center;gap:3px}#gt-header nav a{flex:1;min-height:42px;padding:0 7px;font-size:12px;gap:5px}#gt-header nav svg{width:15px;height:15px}.rights{display:none}#gt-footer{min-height:40px;gap:12px;padding:7px 15px;font-size:10px}#gt-footer a{font-size:10px;padding-left:12px}}
@media(max-width:380px){#gt-header nav a{font-size:11px;gap:4px;padding:0 4px}#gt-header nav svg{width:14px;height:14px}}
@media(max-width:650px){#gt-back{position:absolute;left:7px;top:3px;width:40px;height:40px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}#gt-progress.loading::after{animation:none;width:100%}}
@media(prefers-reduced-transparency:reduce){.glass-backdrop{background:#17202f;-webkit-backdrop-filter:none;backdrop-filter:none}:root[data-page-tone="light"] .glass-backdrop{background:#edf2f7}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.glass-backdrop{background:rgba(19,27,39,.96)}:root[data-page-tone="light"] .glass-backdrop{background:rgba(240,245,250,.96)}}
`;
