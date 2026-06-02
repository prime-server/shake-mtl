const { onRequest } = require("firebase-functions/v2/https");

const SQUARE_TOKEN = "EAAAl2wHgiL97djAd3250MZdlpYXqFaZQyzDeFo9_LdZgShXeCTOLA7jWvBah1ta";
const SQUARE_BASE = "https://connect.squareupsandbox.com";

exports.catalog = onRequest({ cors: true, region: "us-east1" }, async (req, res) => {
  try {
    const resp = await fetch(`${SQUARE_BASE}/v2/catalog/list?types=ITEM,CATEGORY,MODIFIER_LIST,IMAGE`, {
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${SQUARE_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const data = await resp.json();

    // Parse into clean structure
    const objects = data.objects || [];
    const categories = objects
      .filter((o) => o.type === "CATEGORY")
      .map((c) => ({ id: c.id, name: c.category_data.name }));

    const images = {};
    objects
      .filter((o) => o.type === "IMAGE")
      .forEach((img) => { images[img.id] = img.image_data?.url; });

    const items = objects
      .filter((o) => o.type === "ITEM")
      .map((item) => {
        const d = item.item_data;
        const variation = d.variations?.[0]?.item_variation_data;
        const imageUrl = d.image_ids?.length ? images[d.image_ids[0]] : null;
        return {
          id: item.id,
          name: d.name,
          description: d.description_plaintext || d.description || "",
          price: variation?.price_money ? variation.price_money.amount / 100 : 0,
          categoryId: d.category_id || null,
          imageUrl,
        };
      });

    res.set("Cache-Control", "public, max-age=60, s-maxage=60");
    res.json({ categories, items });
  } catch (err) {
    console.error("Square catalog fetch error:", err);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});
