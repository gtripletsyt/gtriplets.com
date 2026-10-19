export async function onRequestPost(context) {
  const SECRET = "c3d92b0d-7fe2-4b9b-8a31-bacon";

  try {
    const body = await context.request.json();

    if (body.secret !== SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const updates = JSON.parse(
      (await context.env.UPDATES.get("updates")) || "[]"
    );

    const imageInputs = [...(Array.isArray(body.images) ? body.images : []), ...(body.image ? [body.image] : [])];
    const images = [...new Set(imageInputs)].slice(0, 10);
    if (images.some(image => typeof image !== "string" || !validImageURL(image))) {
      return Response.json({ error: "Images must be HTTPS URLs or site paths starting with /" }, { status: 400 });
    }
    if (typeof body.title !== "string" || !body.title.trim()) {
      return Response.json({ error: "A title is required" }, { status: 400 });
    }

    updates.unshift({
      title: body.title,
      description: body.description,
      author: body.author,
      date: new Date().toISOString(),
      url: body.url || "#",
      images
    });

    await context.env.UPDATES.put(
      "updates",
      JSON.stringify(updates)
    );

    return Response.json({
      success: true
    });

  } catch (err) {
    return new Response(err.toString(), {
      status: 500
    });
  }
}

function validImageURL(value) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

