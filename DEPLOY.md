# DezSolution — Vercel'ga bepul joylashtirish

Sayt statik fayllardan (root'da) + bitta serverless funksiyadan (`api/lead.js`) iborat.
Vercel ularni bepul, tez (global CDN) va HTTPS bilan joylashtiradi.

Fayl tuzilishi (muhim):
```
index.html, app.js, i18n.js, css/, images/, exports/, robots.txt, sitemap.xml   ← statik (root)
api/lead.js        ← forma → Telegram (Vercel funksiyasi)
vercel.json        ← Vercel sozlamalari
server.js          ← faqat lokal test uchun (Vercel'da ishlatilmaydi)
```

---

## ⚠️ Avval: bot tokenini yangilang

Eski token kod tarixida ochilib qolgan edi. Xavfsizlik uchun **yangi token oling**:

1. Telegram → [@BotFather](https://t.me/BotFather) → `/mybots` → botingiz → **API Token** → **Revoke current token**.
2. Yangi tokenni saqlab qo'ying — uni pastda Vercel'ga kiritasiz (kodga YOZMANG).

---

## 1-qadam: O'zgarishlarni GitHub'ga yuklash

```bash
cd /Users/none/Desktop/dezsolution
git add .
git commit -m "Vercel sozlamalari: api/lead.js, vercel.json"
git push
```

---

## 2-qadam: Vercel loyihasini to'g'ri sozlash

> CSS ishlamasligining asosiy sababi — noto'g'ri "Framework/Output" sozlamasi.
> Quyidagini tekshiring:

1. [vercel.com](https://vercel.com) → loyihangiz → **Settings** → **Build & Deployment** (yoki **General**).
2. Sozlamalar:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`  (public EMAS!)
   - **Build Command:** bo'sh (Override o'chiq)
   - **Output Directory:** bo'sh (Override o'chiq)
   - **Install Command:** bo'sh
3. Saqlang.

> Repoda `vercel.json` bor — u ham shu sozlamalarni majburlaydi, shuning uchun
> statik fayllar root'dan, forma esa `/api/lead` orqali to'g'ri ishlaydi.

---

## 3-qadam: Telegram sozlamalari (Environment Variables)

1. Loyiha → **Settings** → **Environment Variables**.
2. Ikkita o'zgaruvchi qo'shing (**Production** va **Preview** ga belgilang):

| Nomi | Qiymati |
|------|---------|
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan **yangi** token |
| `TELEGRAM_CHAT_ID` | `1105787891` |

3. **Save** → keyin **Deployments** → oxirgi deploy → **⋯** → **Redeploy**
   (o'zgaruvchilar faqat qayta deploydan keyin kuchga kiradi).

> Botingizga kamida bir marta `/start` yozgan bo'lishingiz kerak, aks holda Telegram xabar yubormaydi.

---

## 4-qadam: O'z domeningizni ulash (dezsolution.uz)

1. Loyiha → **Settings** → **Domains** → `dezsolution.uz` kiriting → **Add**.
2. Vercel DNS yozuvlarini beradi. Domen registratoringizda (sotib olgan joyingizda) DNS'ga qo'shing:
   - **A** yozuv: `@` → `76.76.21.21`
   - **CNAME** yozuv: `www` → `cname.vercel-dns.com`
   (Aniq qiymatlarni Vercel o'zi ko'rsatadi — ularni ishlating.)
3. HTTPS (SSL) avtomatik, bepul beriladi.

---

## 5-qadam: Tekshirish

1. Vercel bergan `nom.vercel.app` (yoki `dezsolution.uz`) ni oching — **CSS bilan** to'liq ochilishi kerak.
2. Brauzerda **F12 → Network** → sahifani yangilang → `styles.css` **200** bo'lishi kerak (404 emas).
3. Formaga raqam kiriting va yuboring — Telegramingizga xabar kelishi kerak.
4. `/sitemap.xml` va `/robots.txt` ochilishini tekshiring.

---

## ❗ Xatolarni bartaraf etish

### CSS yuklanmayapti (styles.css 404)
- Vercel **Root Directory** `./` ekanini tekshiring (`public` EMAS).
- **Output Directory** bo'sh bo'lsin (Override o'chiq).
- `index.html`, `css/`, `app.js` fayllari **root'da** turishi kerak (subpapkada emas).

### Forma "not_configured" yoki xato qaytaradi
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` Environment Variables qo'yilmagan yoki
  qo'yilgandan keyin **Redeploy** qilinmagan.

---

## Eslatma: lokal test

Lokalда sinash uchun Node serveridan foydalaning:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=1105787891 node server.js
```

Vercel'da esa `server.js` ishlatilmaydi — uning o'rniga `api/lead.js` ishlaydi.
Ikkalasi bir xil vazifani bajaradi.
