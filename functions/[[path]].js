export async function onRequest(context) {
  const response = await context.next();

  return new HTMLRewriter()
    .on("body", {
      element(element) {
        element.append(`
          <footer style="
            text-align:center;
            padding:20px;
            color:#9ca3af;
            font-family:Arial,sans-serif;
            font-size:14px;
          ">
            © 2026 G Triplets. all rights reserved.
          </footer>
        `, { html: true });
      }
    })
    .transform(response);
}
