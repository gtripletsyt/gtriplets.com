export async function onRequest(context) {
  const response = await context.next();
  const { pathname } = new URL(context.request.url);

  const excludedPaths = [
    "/games/drift-boss",
    "/games/gd",
    "/games/flappy"
  ];

  if (
    excludedPaths.some(
      path => pathname === path || pathname.startsWith(path + "/")
    )
  ) {
    return response;
  }

  // Only modify HTML pages.
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const currentPath = pathname.replace(/\/+$/, "") || "/";

  const navLinks = [
    ["/", "home"],
    ["/about", "about"],
    ["/contact", "contact"],
    ["/games", "games"],
    ["/live", "blog"],
    ["/tools", "tools"]
  ];

  const navigation = navLinks.map(([href, label]) => {
    const active =
      currentPath === href ||
      (href !== "/" && currentPath.startsWith(href + "/"));

    return `
      <a href="${href}"
         ${active ? 'class="gt-active" aria-current="page"' : ""}>
        ${label}
      </a>
    `;
  }).join("");

  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(`
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4454994261105400"
            crossorigin="anonymous">
          </script>

          <style>
            :root {
              --gt-cyan: #62f5ff;
              --gt-purple: #a78bfa;
              --gt-text: #f0f6ff;
              --gt-muted: #9aaac4;
              --gt-header-height: 76px;
              --gt-footer-height: 58px;
            }

            html {
              scroll-padding-top: calc(var(--gt-header-height) + 16px);
            }

            body {
              padding-top: var(--gt-header-height);
              padding-bottom: calc(
                var(--gt-footer-height) +
                env(safe-area-inset-bottom, 0px)
              );
            }

            #secret {
              display: none;
            }

            #gt-header,
            #gt-footer,
            #gt-header *,
            #gt-footer * {
              box-sizing: border-box;
            }

            #gt-header,
            #gt-footer {
              position: fixed;
              left: 0;
              right: 0;
              width: 100%;
              margin: 0;
              color: var(--gt-text);
              font-family: Arial, Helvetica, sans-serif;
              -webkit-backdrop-filter: blur(22px) saturate(150%);
              backdrop-filter: blur(22px) saturate(150%);
              isolation: isolate;
            }

            /* HEADER */

            #gt-header {
              top: 0;
              height: var(--gt-header-height);
              padding: 0 28px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              background:
                radial-gradient(
                  ellipse at top left,
                  rgba(98, 245, 255, 0.10),
                  transparent 55%
                ),
                rgba(7, 11, 23, 0.94);
              border: 0;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.28);
              z-index: 999999;
            }

            #gt-header::after,
            #gt-footer::before {
              content: "";
              position: absolute;
              left: 0;
              right: 0;
              height: 1px;
              pointer-events: none;
              background: linear-gradient(
                90deg,
                transparent,
                var(--gt-cyan),
                var(--gt-purple),
                transparent
              );
              opacity: 0.7;
            }

            #gt-header::after {
              bottom: 0;
              box-shadow: 0 0 16px rgba(98, 245, 255, 0.35);
            }

            #gt-header .gt-logo {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              flex-shrink: 0;
              color: var(--gt-text);
              text-decoration: none;
              white-space: nowrap;
            }

            #gt-header .gt-mark {
              display: grid;
              place-items: center;
              width: 38px;
              height: 38px;
              border: 1px solid rgba(98, 245, 255, 0.5);
              border-radius: 12px 4px 12px 4px;
              background: linear-gradient(
                135deg,
                rgba(98, 245, 255, 0.16),
                rgba(167, 139, 250, 0.12)
              );
              color: var(--gt-cyan);
              font-size: 15px;
              font-weight: 800;
              letter-spacing: -1px;
              box-shadow:
                inset 0 0 14px rgba(98, 245, 255, 0.07),
                0 0 18px rgba(98, 245, 255, 0.09);
            }

            #gt-header .gt-wordmark {
              font-size: 19px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            #gt-header .gt-wordmark span {
              color: var(--gt-cyan);
            }

            #gt-header nav {
              display: flex;
              align-items: center;
              gap: 5px;
              min-width: 0;
            }

            #gt-header nav a {
              position: relative;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              min-height: 42px;
              padding: 0 15px;
              border: 1px solid transparent;
              border-radius: 9px;
              color: var(--gt-muted);
              background: transparent;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 1.4px;
              line-height: 1;
              text-decoration: none;
              text-transform: uppercase;
              white-space: nowrap;
              transition:
                color 180ms ease,
                background 180ms ease,
                border-color 180ms ease,
                box-shadow 180ms ease;
            }

            #gt-header nav a:hover {
              color: var(--gt-text);
              border-color: rgba(98, 245, 255, 0.22);
              background: rgba(98, 245, 255, 0.06);
            }

            #gt-header nav a.gt-active {
              color: var(--gt-cyan);
              border-color: rgba(98, 245, 255, 0.32);
              background: linear-gradient(
                135deg,
                rgba(98, 245, 255, 0.12),
                rgba(167, 139, 250, 0.06)
              );
              box-shadow: inset 0 0 18px rgba(98, 245, 255, 0.04);
            }

            #gt-header nav a.gt-active::after {
              content: "";
              position: absolute;
              bottom: -1px;
              left: 25%;
              width: 50%;
              height: 2px;
              background: var(--gt-cyan);
              box-shadow: 0 0 10px var(--gt-cyan);
            }

            /* FOOTER */

            #gt-footer {
              bottom: 0;
              min-height: calc(
                var(--gt-footer-height) +
                env(safe-area-inset-bottom, 0px)
              );
              padding: 10px 28px
                calc(10px + env(safe-area-inset-bottom, 0px));
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              background: rgba(7, 11, 23, 0.94);
              border: 0;
              box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
              z-index: 999998;
            }

            #gt-footer::before {
              top: 0;
              opacity: 0.4;
            }

            #gt-footer .gt-copyright {
              margin: 0;
              color: var(--gt-muted);
              font-size: 11px;
              letter-spacing: 0.5px;
              line-height: 1.5;
            }

            #gt-footer .gt-home {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 9px;
              flex-shrink: 0;
              min-height: 36px;
              padding: 0 14px;
              border: 1px solid rgba(98, 245, 255, 0.25);
              border-radius: 7px;
              color: var(--gt-cyan);
              background: rgba(98, 245, 255, 0.04);
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.4px;
              text-transform: uppercase;
              text-decoration: none;
              transition:
                background 180ms ease,
                box-shadow 180ms ease;
            }

            #gt-footer .gt-home:hover {
              background: rgba(98, 245, 255, 0.12);
              box-shadow: 0 0 20px rgba(98, 245, 255, 0.12);
            }

            #gt-header a:focus-visible,
            #gt-footer a:focus-visible {
              outline: 2px solid var(--gt-cyan);
              outline-offset: 4px;
            }

            /* MOBILE */

            @media (max-width: 760px) {
              :root {
                --gt-header-height: 116px;
                --gt-footer-height: 64px;
              }

              #gt-header {
                flex-direction: column;
                justify-content: center;
                gap: 10px;
                padding: 10px 12px;
              }

              #gt-header .gt-mark {
                width: 30px;
                height: 30px;
                font-size: 12px;
              }

              #gt-header .gt-wordmark {
                font-size: 16px;
              }

              #gt-header nav {
                width: 100%;
                justify-content: center;
                gap: 3px;
              }

              #gt-header nav a {
                min-height: 40px;
                padding: 0 9px;
                font-size: 10px;
                letter-spacing: 0.7px;
              }

              #gt-footer {
                padding-left: 14px;
                padding-right: 14px;
                gap: 10px;
              }

              #gt-footer .gt-copyright {
                max-width: 200px;
                font-size: 10px;
              }

              #gt-footer .gt-home {
                padding: 0 10px;
                font-size: 9px;
                letter-spacing: 0.7px;
              }
            }

            @media (max-width: 380px) {
              #gt-header nav {
                gap: 1px;
              }

              #gt-header nav a {
                padding: 0 6px;
                font-size: 9px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              #gt-header *,
              #gt-footer * {
                transition: none !important;
              }
            }
          </style>
        `, { html: true });
      }
    })
    .on("body", {
      element(element) {
        element.prepend(`
          <header id="gt-header">
            <a href="/" class="gt-logo" aria-label="G Triplets home">
              <span class="gt-mark" aria-hidden="true">GT</span>
              <span class="gt-wordmark">g<span>triplets</span></span>
            </a>

            <nav aria-label="Main navigation">
              ${navigation}
            </nav>
          </header>
        `, { html: true });

        element.append(`
          <footer id="gt-footer">
            <p class="gt-copyright">
              &copy; ${new Date().getUTCFullYear()} gtriplets.com.
              All rights reserved.
            </p>

            <a href="/" class="gt-home">
              <span aria-hidden="true">&#8592;</span>
              back home
            </a>
          </footer>
        `, { html: true });
      }
    })
    .transform(response);
}
