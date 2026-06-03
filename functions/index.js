const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const squareToken = defineSecret("SQUARE_TOKEN");
const webhookSigKey = defineSecret("SQUARE_WEBHOOK_SIG_KEY");

const SQUARE_BASE = "https://connect.squareup.com";
const LOCATION_ID = "LEDCSA0Q805WD";

// ============================================================
// Server-side in-memory caches (per Cloud Functions instance)
// ============================================================
let catalogCache = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let summaryCache = null;
let summaryCacheTime = 0;
const SUMMARY_CACHE_TTL = 30 * 1000; // 30 seconds

// ============================================================
// Rate limiter — in-memory, per Cloud Functions instance
// ============================================================
const rateLimitMap = new Map(); // ip -> { count, resetAt }
function checkRateLimit(ip, maxPerMinute = 10) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  if (entry.count > maxPerMinute) return false;
  return true;
}

// ============================================================
// Webhook signature verification
// ============================================================
function verifySquareWebhook(signature, body, sigKey) {
  if (!sigKey) return null; // no key configured — skip verification
  const hmac = crypto.createHmac("sha256", sigKey);
  hmac.update(typeof body === "string" ? body : JSON.stringify(body));
  const hash = hmac.digest("base64");
  return hash === signature;
}

// ============================================================
// Dynamic ET offset helper
// ============================================================
function getETOffset() {
  const now = new Date();
  const etString = now.toLocaleString("en-US", { timeZone: "America/Toronto" });
  const etDate = new Date(etString);
  const offsetMs = now.getTime() - etDate.getTime();
  const offsetHours = Math.round(offsetMs / 3600000);
  return `${offsetHours >= 0 ? "-" : "+"}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;
}

// ============================================================
// Auth helper — verify staff/admin role
// ============================================================
const ADMIN_EMAILS = ["shakemtl@gmail.com"];

async function verifyStaff(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await db.doc(`users/${decoded.uid}`).get();
    const role = userDoc.data()?.role;
    if (role === "staff" || role === "admin") return decoded;
    if (decoded.email && ADMIN_EMAILS.includes(decoded.email.toLowerCase())) return decoded;
    return null;
  } catch {
    return null;
  }
}

// SMS config — set in Firestore settings/sms doc
// { provider: "twilio"|"telnyx", accountSid, authToken, from }
async function sendSMS(to, body) {
  const configSnap = await db.doc("settings/sms").get();
  if (!configSnap.exists) {
    console.warn("SMS not configured — settings/sms doc missing");
    return false;
  }
  const cfg = configSnap.data();

  if (cfg.provider === "twilio") {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: cfg.from, Body: body }),
      }
    );
    const data = await resp.json();
    return !!data.sid;
  }

  if (cfg.provider === "telnyx") {
    const resp = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: cfg.from, to, text: body }),
    });
    const data = await resp.json();
    return !!data.data?.id;
  }

  return false;
}

// Helper: fetch from Square
async function sq(path, opts = {}) {
  const resp = await fetch(`${SQUARE_BASE}${path}`, {
    ...opts,
    headers: {
      "Square-Version": "2024-01-18",
      Authorization: `Bearer ${squareToken.value()}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  return resp.json();
}

// ============================================================
// GET /api/catalog — pull full catalog with images from Square
// ============================================================
exports.catalog = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  try {
    // Return cached data if still fresh
    const now = Date.now();
    if (catalogCache && (now - catalogCacheTime) < CATALOG_CACHE_TTL) {
      res.set("Cache-Control", "public, max-age=300, s-maxage=300");
      res.json(catalogCache);
      return;
    }

    // Paginate to get ALL objects (Square returns max 100 per call)
    let allObjects = [];
    let cursor = null;
    do {
      const url = "/v2/catalog/list?types=ITEM,CATEGORY,IMAGE" + (cursor ? `&cursor=${cursor}` : "");
      const data = await sq(url);
      allObjects = allObjects.concat(data.objects || []);
      cursor = data.cursor || null;
    } while (cursor);

    // Build image URL map
    const images = {};
    allObjects
      .filter((o) => o.type === "IMAGE")
      .forEach((img) => { images[img.id] = img.image_data?.url || null; });

    // Parse categories
    const categories = allObjects
      .filter((o) => o.type === "CATEGORY")
      .map((c) => ({
        id: c.id,
        name: c.category_data.name,
        ordinal: c.category_data.parent_category?.ordinal || 0,
      }))
      .sort((a, b) => a.ordinal - b.ordinal);

    // Parse items — resolve images and categories
    const items = allObjects
      .filter((o) => o.type === "ITEM" && !o.is_deleted)
      .map((item) => {
        const d = item.item_data;
        const variation = d.variations?.[0];
        const varData = variation?.item_variation_data;
        const imageId = d.image_ids?.[0];
        return {
          id: item.id,
          variationId: variation?.id || null,
          name: d.name,
          description: d.description_plaintext || d.description || "",
          price: varData?.price_money ? varData.price_money.amount / 100 : 0,
          priceCents: varData?.price_money?.amount || 0,
          categoryId: d.categories?.[0]?.id || d.category_id || null,
          imageUrl: imageId ? (images[imageId] || null) : null,
        };
      });

    // Update server-side cache
    catalogCache = { categories, items };
    catalogCacheTime = Date.now();

    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json(catalogCache);
  } catch (err) {
    console.error("Catalog error:", err);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// ============================================================
// POST /api/checkout — create Square checkout link for pickup
// ============================================================
exports.checkout = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }

  // Rate limit: max 10 checkouts per IP per minute
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
  if (!checkRateLimit(clientIp, 10)) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return;
  }

  try {
    const { items, customerName, customerPhone, customerEmail, pickupNote, pickupType, pickupDate, pickupTime } = req.body;
    if (!items?.length) { res.status(400).json({ error: "Cart empty" }); return; }

    const lineItems = items.map((i) => ({
      catalog_object_id: i.variationId,
      quantity: String(i.quantity),
    }));

    const idempotencyKey = `co-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Build pickup details — ASAP or SCHEDULED
    const pickupDetails = {
      recipient: {
        display_name: customerName || "Guest",
        phone_number: customerPhone || "",
      },
      note: pickupNote || "",
      schedule_type: "ASAP",
      prep_time_duration: "P0DT0H15M0S",
    };

    if (pickupType === "scheduled" && pickupDate && pickupTime) {
      pickupDetails.schedule_type = "SCHEDULED";
      // pickupDate = "YYYY-MM-DD", pickupTime = "HH:MM"
      const etOffset = getETOffset();
      pickupDetails.pickup_at = `${pickupDate}T${pickupTime}:00${etOffset}`;
      delete pickupDetails.prep_time_duration;
    }

    const checkoutResp = await sq("/v2/online-checkout/payment-links", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        order: {
          location_id: LOCATION_ID,
          line_items: lineItems,
          fulfillments: [{
            type: "PICKUP",
            state: "PROPOSED",
            pickup_details: pickupDetails,
          }],
        },
        checkout_options: {
          redirect_url: "https://shakewebapp.web.app/?order=success",
          ask_for_shipping_address: false,
        },
      }),
    });

    if (checkoutResp.payment_link) {
      // Save order to Firestore for admin tracking
      // Extract order ID — Square returns it in different shapes
      const related = checkoutResp.related_resources || {};
      const relOrders = related.orders || [];
      const squareOrderId = (typeof relOrders[0] === 'string' ? relOrders[0] : relOrders[0]?.id) || null;
      const linkId = checkoutResp.payment_link.id || null;
      const orderId = squareOrderId || linkId || idempotencyKey;

      await db.collection("orders").doc(orderId).set({
        customerName: customerName || "Guest",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || "",
        pickupNote: pickupNote || "",
        pickupType: pickupType || "asap",
        pickupDate: pickupDate || null,
        pickupTime: pickupTime || null,
        items: items,
        status: "pending_payment",
        squarePaymentLinkId: linkId,
        squareCheckoutUrl: checkoutResp.payment_link.url,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ checkoutUrl: checkoutResp.payment_link.url, orderId });
    } else {
      console.error("Square checkout error:", JSON.stringify(checkoutResp));
      res.status(500).json({ error: "Checkout failed", details: checkoutResp.errors });
    }
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ============================================================
// POST /api/webhook — Square webhook for order updates
// ============================================================
exports.webhook = onRequest({ cors: false, region: "us-east1", secrets: [squareToken, webhookSigKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }

  try {
    // Verify Square webhook signature if key is configured
    const sigKey = webhookSigKey.value();
    const signature = req.headers["x-square-hmacsha256-signature"];
    if (sigKey && sigKey !== "placeholder" && sigKey.length > 10) {
      const valid = verifySquareWebhook(signature, req.body, sigKey);
      if (!valid) {
        console.warn("Webhook signature verification failed");
        res.status(403).send("Invalid signature");
        return;
      }
    } else {
      console.warn("SQUARE_WEBHOOK_SIG_KEY not set — skipping signature verification");
    }

    const event = req.body;
    const type = event.type;

    if (type === "order.updated" || type === "payment.completed") {
      const orderId = event.data?.object?.order?.id ||
                      event.data?.object?.payment?.order_id;

      if (orderId) {
        const orderRef = db.collection("orders").doc(orderId);
        const snap = await orderRef.get();

        if (snap.exists) {
          if (type === "payment.completed") {
            await orderRef.update({
              status: "preparing",
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } else {
          // Order came from Square directly (POS, etc) — store it
          const orderData = event.data?.object?.order || {};
          await orderRef.set({
            customerName: orderData.fulfillments?.[0]?.pickup_details?.recipient?.display_name || "Walk-in",
            customerPhone: orderData.fulfillments?.[0]?.pickup_details?.recipient?.phone_number || "",
            customerEmail: "",
            status: type === "payment.completed" ? "preparing" : "pending_payment",
            source: "square_direct",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("OK"); // Always 200 to prevent Square retries
  }
});

// ============================================================
// GET /api/orders — list orders for admin dashboard (auth required)
// ============================================================
exports.orders = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const status = req.query.status || "all";
    let query = db.collection("orders").orderBy("createdAt", "desc").limit(50);

    if (status !== "all") {
      query = db.collection("orders")
        .where("status", "==", status)
        .orderBy("createdAt", "desc")
        .limit(50);
    }

    const snap = await query.get();
    const orders = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      paidAt: d.data().paidAt?.toDate?.()?.toISOString() || null,
      readyAt: d.data().readyAt?.toDate?.()?.toISOString() || null,
    }));

    res.json({ orders });
  } catch (err) {
    console.error("Orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ============================================================
// POST /api/order-start — mark order as preparing (auth required)
// ============================================================
exports.orderStart = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { orderId } = req.body;
    if (!orderId) { res.status(400).json({ error: "Missing orderId" }); return; }

    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) { res.status(404).json({ error: "Order not found" }); return; }

    await orderRef.update({
      status: "preparing",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Order start error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ============================================================
// POST /api/order-ready — mark order ready + send SMS (auth required)
// ============================================================
exports.orderReady = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { orderId } = req.body;
    if (!orderId) { res.status(400).json({ error: "Missing orderId" }); return; }

    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) { res.status(404).json({ error: "Order not found" }); return; }

    const order = snap.data();

    // Update status
    await orderRef.update({
      status: "ready",
      readyAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send SMS notification
    let smsSent = false;
    if (order.customerPhone) {
      const phone = order.customerPhone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

      smsSent = await sendSMS(
        formattedPhone,
        `Hey ${order.customerName}! Your SHAKE. order is ready for pickup. 🥤 See you at the bar!`
      );

      await orderRef.update({ smsSent });
    }

    res.json({ success: true, smsSent });
  } catch (err) {
    console.error("Order ready error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ============================================================
// POST /api/order-complete — mark order as picked up (auth required)
// ============================================================
exports.orderComplete = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { orderId } = req.body;
    if (!orderId) { res.status(400).json({ error: "Missing orderId" }); return; }

    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) { res.status(404).json({ error: "Order not found" }); return; }

    await orderRef.update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// ============================================================
// Helper: search Square orders by date range
// ============================================================
async function searchSquareOrders(startAt, endAt) {
  const filter = { date_time_filter: { created_at: { start_at: startAt } } };
  if (endAt) filter.date_time_filter.created_at.end_at = endAt;

  let allOrders = [];
  let cursor = null;
  do {
    const body = {
      location_ids: [LOCATION_ID],
      query: { filter, sort: { sort_field: "CREATED_AT", sort_order: "DESC" } },
      limit: 100,
    };
    if (cursor) body.cursor = cursor;
    const data = await sq("/v2/orders/search", { method: "POST", body: JSON.stringify(body) });
    allOrders = allOrders.concat(data.orders || []);
    cursor = data.cursor || null;
  } while (cursor);
  return allOrders;
}

function parseSquareOrder(o) {
  const totalCents = o.total_money?.amount || 0;
  const items = (o.line_items || []).map((li) => ({
    name: li.name || "Item",
    quantity: parseInt(li.quantity) || 1,
    priceCents: li.total_money?.amount || 0,
  }));
  const source = o.source?.name || (o.tenders?.[0]?.type === "CASH" ? "POS (Cash)" : "POS");
  const customer = o.fulfillments?.[0]?.pickup_details?.recipient?.display_name || "Walk-in";
  const tenderType = o.tenders?.[0]?.type || "UNKNOWN";
  const employeeId = o.tenders?.[0]?.employee_id;
  const collectedBy = employeeId ? `Employee ${employeeId}` : (o.source?.name || "Shake MTL");
  return {
    id: o.id,
    customerName: customer,
    items,
    totalCents,
    status: (o.state || "").toLowerCase(),
    source,
    tenderType,
    collectedBy,
    createdAt: o.created_at,
  };
}

// ============================================================
// GET /api/daily-summary — today's stats from Square (auth required)
// ============================================================
exports.dailySummary = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    // Return cached data if still fresh (30s TTL)
    const now = Date.now();
    if (summaryCache && (now - summaryCacheTime) < SUMMARY_CACHE_TTL) {
      res.set("Cache-Control", "public, max-age=30, s-maxage=30");
      res.json(summaryCache);
      return;
    }

    const etNow = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    const offsetStr = getETOffset();
    const startAt = `${etNow}T00:00:00${offsetStr}`;

    const orders = await searchSquareOrders(startAt);
    const completed = orders.filter((o) => o.state === "COMPLETED");

    let totalSales = 0;
    let totalTax = 0;
    completed.forEach((o) => {
      totalSales += o.total_money?.amount || 0;
      totalTax += o.total_tax_money?.amount || 0;
    });

    const pending = orders.filter((o) => o.state === "OPEN").length;

    const result = {
      date: etNow,
      orderCount: completed.length,
      totalSales,
      totalTax,
      averageOrder: completed.length > 0 ? Math.round(totalSales / completed.length) : 0,
      pendingOrders: pending,
    };

    // Update server-side cache
    summaryCache = result;
    summaryCacheTime = Date.now();

    res.set("Cache-Control", "public, max-age=30, s-maxage=30");
    res.json(result);
  } catch (err) {
    console.error("Daily summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// ============================================================
// POST /api/sales-report — sales data from Square (auth required)
// ============================================================
exports.salesReport = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { startDate, endDate } = req.body;
    if (!startDate) { res.status(400).json({ error: "Missing startDate" }); return; }

    const orders = await searchSquareOrders(startDate, endDate || undefined);
    const parsed = orders.map(parseSquareOrder);
    const completed = parsed.filter((o) => o.status === "completed");

    let totalSales = 0;
    completed.forEach((o) => { totalSales += o.totalCents; });

    // Return all orders in table but totals only reflect completed orders
    res.json({
      orders: parsed,
      totalSales,
      orderCount: completed.length,
      totalOrderCount: parsed.length,
      avgOrder: completed.length > 0 ? Math.round(totalSales / completed.length) : 0,
      note: "totalSales/orderCount/avgOrder reflect COMPLETED orders only",
    });
  } catch (err) {
    console.error("Sales report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ============================================================
// POST /api/catalog-update — update a catalog item via Square (auth required)
// ============================================================
exports.catalogUpdate = onRequest({ cors: true, region: "us-east1", secrets: [squareToken] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const caller = await verifyStaff(req);
  if (!caller) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { itemId, name, description, priceCents } = req.body;
    if (!itemId) { res.status(400).json({ error: "Missing itemId" }); return; }

    // Fetch current item from Square
    const current = await sq(`/v2/catalog/object/${itemId}`);
    if (!current.object) {
      res.status(404).json({ error: "Item not found in Square" });
      return;
    }

    const obj = current.object;
    const itemData = obj.item_data;

    // Apply updates
    if (name) itemData.name = name;
    if (description !== undefined) {
      itemData.description = description;
      itemData.description_plaintext = description;
      itemData.description_html = `<p>${description}</p>`;
    }

    // Update price on first variation
    if (priceCents !== undefined && itemData.variations?.[0]) {
      const varData = itemData.variations[0].item_variation_data;
      if (varData) {
        varData.price_money = {
          amount: priceCents,
          currency: "CAD",
        };
      }
    }

    // Clean fields Square rejects on upsert
    const stripFields = ["created_at", "updated_at", "is_deleted", "present_at_all_locations"];
    stripFields.forEach((f) => delete obj[f]);
    if (itemData.variations) {
      itemData.variations.forEach((v) => stripFields.forEach((f) => delete v[f]));
    }

    // Upsert to Square
    const upsertResp = await sq("/v2/catalog/object", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `cu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        object: obj,
      }),
    });

    if (upsertResp.catalog_object) {
      // Invalidate catalog cache so next request picks up the change
      catalogCache = null;
      catalogCacheTime = 0;
      res.json({ success: true, item: upsertResp.catalog_object });
    } else {
      console.error("Square catalog update error:", JSON.stringify(upsertResp));
      res.status(500).json({ error: "Square update failed", details: upsertResp.errors });
    }
  } catch (err) {
    console.error("Catalog update error:", err);
    res.status(500).json({ error: "Failed to update catalog item" });
  }
});
