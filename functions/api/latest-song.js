
export async function onRequest(context) {
  const { env } = context;

  if (!env.LATEST_SONG_URL) {
    return Response.json(
      { error: "No song configured" },
      { status: 404 }
    );
  }

  return Response.json(
    {
      title: env.LATEST_SONG_TITLE || "latest song",
      url: env.LATEST_SONG_URL
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
