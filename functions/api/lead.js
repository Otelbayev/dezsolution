/**
 * Cloudflare Pages Function — POST /api/lead
 * Formadan kelgan telefon raqamni qabul qiladi va Telegramga yuboradi.
 *
 * Muhit o'zgaruvchilari (Cloudflare Pages → Settings → Environment variables):
 *   TELEGRAM_BOT_TOKEN — @BotFather bergan token
 *   TELEGRAM_CHAT_ID   — xabar boradigan chat id (masalan 1105787891)
 */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Preflight (CORS) — file:// yoki boshqa domendan test uchun
export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const phone = (data.phone || "").toString();
  if (!/^\+998\d{9}$/.test(phone)) {
    return json({ ok: false, error: "invalid_phone" }, 400);
  }

  const lead = {
    phone,
    name: (data.name || "").toString().slice(0, 80),
    service: (data.service || "").toString().slice(0, 80),
    source: (data.source || "unknown").toString().slice(0, 40),
    lang: (data.lang || "").toString().slice(0, 5),
    createdAt: new Date().toISOString(),
  };

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Sozlanmagan bo'lsa ham foydalanuvchiga xato ko'rsatmaymiz, lekin log qoldiramiz
    console.error("Telegram env o'zgaruvchilari yo'q (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).");
    return json({ ok: false, error: "not_configured" }, 500);
  }

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
      return json({ ok: false, error: "telegram_failed" }, 502);
    }
  } catch (e) {
    console.error("Telegram tarmoq xatosi:", e.message);
    return json({ ok: false, error: "telegram_error" }, 502);
  }

  return json({ ok: true });
}
