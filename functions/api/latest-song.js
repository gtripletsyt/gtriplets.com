
export async function onRequest({ env }) {
  if (!env.LATEST_SONG_URL) {
    return Response.json(
      { error: "no song configured" },
      { status: 404 }
    );
  }

  return Response.json({
    title: env.LATEST_SONG_TITLE || "Latest Song",
    url: env.LATEST_SONG_URL,
    art: env.LATEST_SONG_ART_URL || ""
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
