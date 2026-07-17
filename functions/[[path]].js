export async function onRequest(context) {
  const response = await context.next();

  return new HTMLRewriter()

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
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: center;
            padding: 20px;
            color: #9ca3af;
            font-size: 14px;
            font-family: Arial, sans-serif;
            background: rgba(0, 0, 0, 0.2);
            z-index: 9999;
}
          </style>
        `, { html: true });
      }
    })
    
    .on("body", {
  element(element) {
    element.append(`
      <footer>
        <a href="/" class="home-button">back home</a>
        <br>
        © 2026 gtriplets.com. all rights reserved.
      </footer>
    `, { html: true });
  }
})

    .transform(response);
}
