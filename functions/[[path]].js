export async function onRequest(context) {
  const response = await context.next();

  return new HTMLRewriter()

    // Add CSS into every page
    .on("head", {
      element(element) {
        element.append(`
          <style>
            html, body {
              height: 100%;
            }

            body {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }

            footer {
              margin-top: auto;
              text-align: center;
              padding: 20px;
              color: #9ca3af;
              font-size: 14px;
              font-family: Arial, sans-serif;
            }
          </style>
        `, { html: true });
      }
    })

    // Add footer before the end of body
    .on("body", {
      element(element) {
        element.append(`
          <footer>
            © 2026 gtriplets.com. all rights reserved.
          </footer>
        `, { html: true });
      }
    })

    .transform(response);
}
