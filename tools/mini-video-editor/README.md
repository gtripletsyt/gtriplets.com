# Mini Video Editor

A simple browser video editor with drag-and-drop media, a timeline, trimming, photo-to-video conversion with selectable FPS, and FFmpeg.wasm export.

## Run

### Easiest
Open `index.html` through a local web server. Do not use `file://` because browser workers and FFmpeg.wasm need a proper origin.

With Node.js:

```bash
npx serve .
```

Then open the local URL it prints.

### Cloudflare Pages
Upload the four files in this folder to your Pages project. No server-side code is required. FFmpeg core files are loaded from jsDelivr at runtime.

## Features

- Drag/drop video, audio, and images
- Timeline clips
- Clip start/end trimming
- Delete/reorder-ready timeline structure
- Import many photos and choose FPS
- Photo sequence converted to WebM
- FFmpeg.wasm export to WebM
- Processing happens in the browser

## Notes

This is intentionally a lightweight editor. The current exporter produces a 1280×720 WebM video and combines the video/image clips. Audio mixing and more advanced editing tools can be added later.
