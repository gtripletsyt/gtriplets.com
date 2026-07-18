export async function onRequest(context) {

  const updates = [
    {
      title: "yoooooo hopefully this works... im hoping",
      author: "gtripletsyt",
      date: new Date().toISOString(),
      url: "#"
    },
    {
      title: "ive done as much as i could, might take a lil break",
      author: "gtripletsyt",
      date: new Date().toISOString(),
      url: "#"
    }
  ];

  return Response.json(updates);
}
