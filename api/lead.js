/**
 * Vercel Serverless Function — POST /api/lead
 * Formadan kelgan telefon raqamni Telegramga yuboradi.
 *
 * Environment Variables (Vercel → Project → Settings → Environment Variables):
 *   TELEGRAM_BOT_TOKEN — @BotFather bergan token
 *   TELEGRAM_CHAT_ID   — xabar boradigan chat id (masalan 1105787891)
 */

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  // Vercel odatda JSON body'ni avtomatik parse qiladi
  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (e) { data = {}; }
  }
  if (!data || typeof data !== "object") data = {};

  const phone = (data.phone || "").toString();
  if (!/^\+998\d{9}$/.test(phone)) {
    res.status(400).json({ ok: false, error: "invalid_phone" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Telegram env yo'q (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).");
    res.status(500).json({ ok: false, error: "not_configured" });
    return;
  }

  const lead = {
    phone,
    name: (data.name || "").toString().slice(0, 80),
    service: (data.service || "").toString().slice(0, 80),
    source: (data.source || "unknown").toString().slice(0, 40),
    lang: (data.lang || "").toString().slice(0, 5),
    createdAt: new Date().toISOString(),
  };

  const text =
    "🔔 Yangi buyurtma — DezSolution\n\n" +
    "📞 Telefon: " + lead.phone + "\n" +
    (lead.name ? "👤 Ism: " + lead.name + "\n" : "") +
    (lead.service ? "🧪 Xizmat: " + lead.service + "\n" : "") +
    "📍 Manba: " + lead.source + (lead.lang ? " (" + lead.lang + ")" : "") + "\n" +
    "🕒 Vaqt: " + lead.createdAt;

  try {
    const tgRes = await fetch(
      "https://api.telegram.org/bot" + token + "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
    const tgJson = await tgRes.json();
    if (!tgJson.ok) {
      console.error("Telegram rad etdi:", tgJson.error_code, tgJson.description);
      res.status(502).json({ ok: false, error: "telegram_failed" });
      return;
    }
  } catch (e) {
    console.error("Telegram xatosi:", e.message);
    res.status(502).json({ ok: false, error: "telegram_error" });
    return;
  }

  res.status(200).json({ ok: true });
};
