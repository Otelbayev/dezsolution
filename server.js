/* ============================================================
   DezSolution — oddiy backend (faqat Node.js, tashqi kutubxonasiz)
   - Statik fayllarni (index.html, css, js) tarqatadi
   - POST /api/lead — telefon raqamni qabul qiladi, leads.json ga saqlaydi
   - Ixtiyoriy: Telegram botga xabar yuboradi (env orqali)

   Ishga tushirish:  node server.js
   Portni o'zgartirish:  PORT=8080 node server.js

   Telegram bildirishnoma (ixtiyoriy):
     TELEGRAM_BOT_TOKEN=xxxx TELEGRAM_CHAT_ID=123456 node server.js
   ============================================================ */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");

// gzip qilinadigan matn turlari
const COMPRESSIBLE = new Set([
  ".html", ".css", ".js", ".svg", ".json", ".xml", ".txt",
]);
// cache muddati (soniya): rasmlar uzoq, kod qisqaroq, html revalidatsiya
function cacheControl(ext) {
  if (ext === ".html") return "no-cache";
  if (ext === ".png" || ext === ".jpg" || ext === ".ico")
    return "public, max-age=31536000, immutable";
  return "public, max-age=604800"; // css, js, svg — 7 kun
}

const PORT = process.env.PORT || 3000;
// Statik fayllar public/ ichida (Vercel outputDirectory bilan bir xil)
const ROOT = path.join(__dirname, "public");
const LEADS_FILE = path.join(__dirname, "leads.json");

// Maxfiy ma'lumotlar faqat environment orqali (kodda saqlanmaydi!)
// Lokal ishga tushirish:
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node server.js
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

/* ---------- Yordamchilar ---------- */

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// +998XXXXXXXXX ko'rinishini tekshirish
function validPhone(p) {
  return typeof p === "string" && /^\+998\d{9}$/.test(p);
}

function appendLead(lead) {
  let list = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      list = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8")) || [];
    }
  } catch (e) {
    list = [];
  }
  list.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2), "utf8");
}

// Telegramga xabar yuboradi. Promise qaytaradi — serverless (Vercel)da
// javob qaytarishdan oldin `await` qilish uchun, aks holda so'rov uzilib qoladi.
function notifyTelegram(lead) {
  return new Promise((resolve) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️  Telegram env yo'q — xabar yuborilmadi.");
      return resolve(false);
    }

    const text =
      "🔔 Yangi buyurtma — DezSolution\n\n" +
      "📞 Telefon: " +
      lead.phone +
      "\n" +
      (lead.name ? "👤 Ism: " + lead.name + "\n" : "") +
      (lead.service ? "🧪 Xizmat: " + lead.service + "\n" : "") +
      "📍 Manba: " +
      lead.source +
      (lead.lang ? " (" + lead.lang + ")" : "") +
      "\n" +
      "🕒 Vaqt: " +
      lead.createdAt;

    const payload = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
    });

    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: "/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (r) => {
        let resp = "";
        r.on("data", (c) => (resp += c));
        r.on("end", () => {
          try {
            const j = JSON.parse(resp);
            if (j.ok) {
              console.log("📨 Telegramga yuborildi ✓");
              resolve(true);
            } else {
              console.error("❌ Telegram rad etdi:", j.error_code, j.description);
              resolve(false);
            }
          } catch (e) {
            console.error("❌ Telegram javobi noaniq:", resp.slice(0, 200));
            resolve(false);
          }
        });
      },
    );
    req.on("error", (err) => {
      console.error("❌ Telegram tarmoq xatosi:", err.message);
      resolve(false);
    });
    req.on("timeout", () => {
      console.error("❌ Telegram javob bermadi (timeout)");
      req.destroy();
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

/* ---------- Statik fayllar ---------- */

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  // xavfsizlik: papkadan chiqib ketishni bloklash
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 — sahifa topilmadi");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": cacheControl(ext),
    };

    // matn fayllarni gzip bilan siqib yuborish (brauzer qo'llasa)
    const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    if (acceptsGzip && COMPRESSIBLE.has(ext)) {
      zlib.gzip(data, (gzErr, gzipped) => {
        if (gzErr) {
          res.writeHead(200, headers);
          res.end(data);
          return;
        }
        headers["Content-Encoding"] = "gzip";
        headers["Vary"] = "Accept-Encoding";
        res.writeHead(200, headers);
        res.end(gzipped);
      });
      return;
    }

    res.writeHead(200, headers);
    res.end(data);
  });
}

/* ---------- Server ---------- */

const server = http.createServer((req, res) => {
  // CORS (agar frontend boshqa domenda bo'lsa)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: lead qabul qilish
  if (req.method === "POST" && req.url === "/api/lead") {
    let body = "";
    let tooBig = false;
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024) {
        tooBig = true;
        req.destroy();
      }
    });
    req.on("end", async () => {
      if (tooBig) return sendJSON(res, 413, { ok: false, error: "too_large" });

      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return sendJSON(res, 400, { ok: false, error: "bad_json" });
      }

      if (!validPhone(data.phone)) {
        return sendJSON(res, 400, { ok: false, error: "invalid_phone" });
      }

      const lead = {
        phone: data.phone,
        name: (data.name || "").toString().slice(0, 80),
        service: (data.service || "").toString().slice(0, 80),
        source: (data.source || "unknown").toString().slice(0, 40),
        lang: (data.lang || "").toString().slice(0, 5),
        page: (data.page || "").toString().slice(0, 300),
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
        createdAt: new Date().toISOString(),
      };

      // Diskka saqlash — best-effort. Vercel'da fayl tizimi read-only,
      // shuning uchun xato bo'lsa ham so'rovni to'xtatmaymiz (Telegram baribir ketadi).
      try {
        appendLead(lead);
      } catch (e) {
        console.error("Saqlashda xatolik (e'tiborsiz):", e.message);
      }

      // Serverless'da javobdan oldin kutamiz, aks holda so'rov uzilib qoladi.
      await notifyTelegram(lead);
      console.log("✅ Yangi lead:", lead.phone, "(" + lead.source + ")");
      return sendJSON(res, 200, { ok: true });
    });
    return;
  }

  // Statik fayllar
  if (req.method === "GET") return serveStatic(req, res);

  res.writeHead(405);
  res.end("Method Not Allowed");
});

// Startupda Telegram ulanishini tekshirish (getMe) — terminalda holatni ko'rsatadi
function checkTelegram() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("ℹ️  Telegram O'CHIQ: TELEGRAM_BOT_TOKEN kiritilmagan.");
    return;
  }
  if (!TELEGRAM_CHAT_ID) {
    console.log(
      "⚠️  Telegram yarim sozlangan: TELEGRAM_CHAT_ID yo'q — xabar yetib bormaydi.",
    );
    return;
  }
  https
    .get(
      "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/getMe",
      (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => {
          try {
            const j = JSON.parse(d);
            if (j.ok) {
              console.log(
                "✓ Telegram tayyor: @" +
                  j.result.username +
                  " → chat_id " +
                  TELEGRAM_CHAT_ID,
              );
            } else {
              console.error(
                "❌ Telegram token noto'g'ri:",
                j.error_code,
                j.description,
              );
            }
          } catch (e) {
            console.error("❌ Telegram tekshiruvi muvaffaqiyatsiz.");
          }
        });
      },
    )
    .on("error", (e) => console.error("❌ Telegramga ulanib bo'lmadi:", e.message));
}

server.listen(PORT, () => {
  console.log("DezSolution ishga tushdi → http://localhost:" + PORT);
  console.log("Lead fayl:", LEADS_FILE);
  checkTelegram();
});
