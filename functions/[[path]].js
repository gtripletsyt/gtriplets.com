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
            .on("head", {
  element(element) {
    element.append(`
      <style>
        header {
          top: 0;
          left: 0;
          width: 100%;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          color: white;
          font-family: Arial, sans-serif;
          z-index: 9999;
          box-sizing: border-box;
        }

        header .logo {
          font-size: 20px;
          font-weight: bold;
          text-decoration: none;
          color: white;
        }

        header nav {
          display: flex;
          gap: 20px;
        }

        header nav a {
          color: #d1d5db;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        header nav a:hover {
          color: white;
        }

        body {
          padding-top: 60px;
        }
      </style>
    `, { html: true });
  }
})

.on("body", {
  element(element) {
    element.prepend(`
      <header>
        <a href="/" class="logo">gtriplets</a>

        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/games">Games</a>
        </nav>
      </header>
    `, { html: true });
  }
})

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
