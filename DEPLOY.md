# DezSolution — Cloudflare Pages'ga bepul joylashtirish

Sayt statik fayllardan + bitta serverless funksiyadan (`functions/api/lead.js`) iborat.
Cloudflare Pages ularni bepul, tez (global CDN) va HTTPS bilan joylashtiradi.

---

## ⚠️ Avval: bot tokenini yangilang

Eski token kod tarixida ochilib qolgan edi. Xavfsizlik uchun **yangi token oling**:

1. Telegramda [@BotFather](https://t.me/BotFather) → `/mybots` → botingiz → **API Token** → **Revoke current token**.
2. Yangi tokenni saqlab qo'ying — uni pastda Cloudflare'ga kiritasiz.

---

## 1-qadam: Kodni GitHub'ga yuklash

1. [github.com](https://github.com) da yangi (bo'sh, **private** bo'lsa ham bo'ladi) repo oching, masalan `dezsolution`.
2. Terminalда loyiha papkasida:

```bash
cd /Users/none/Desktop/dezsolution
git init
git add .
git commit -m "DezSolution sayti"
git branch -M main
git remote add origin https://github.com/FOYDALANUVCHI/dezsolution.git
git push -u origin main
```

> `.gitignore` tufayli `leads.json`, `node_modules`, `.env` yuklanmaydi.

---

## 2-qadam: Cloudflare Pages'da loyiha yaratish

1. [dash.cloudflare.com](https://dash.cloudflare.com) — ro'yxatdan o'ting (bepul).
2. Chapdan **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. GitHub hisobingizni ulang va `dezsolution` repo'sini tanlang.
4. **Build settings:**
   - Framework preset: **None**
   - Build command: **bo'sh qoldiring**
   - Build output directory: **`/`** (root)
5. **Save and Deploy** bosing.

Bir necha soniyada sayt `nom.pages.dev` manzilida ochiladi.

---

## 3-qadam: Telegram sozlamalari (ENV)

1. Loyiha → **Settings** → **Environment variables** → **Production**.
2. Ikkita o'zgaruvchi qo'shing:

| Nomi | Qiymati |
|------|---------|
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan **yangi** token |
| `TELEGRAM_CHAT_ID` | `1105787891` |

3. **Save** bosing va **Deployments** → oxirgi deploy → **Retry deployment** (yoki qaytadan push qiling), toki o'zgaruvchilar kuchga kirsin.

> Botingizga kamida bir marta `/start` yozgan bo'lishingiz kerak, aks holda Telegram xabar yubormaydi.

---

## 4-qadam: O'z domeningizni ulash (dezsolution.uz)

1. Loyiha → **Custom domains** → **Set up a domain** → `dezsolution.uz` kiriting.
2. Cloudflare sizga DNS ko'rsatmalarini beradi. Ikki yo'l bor:
   - **Eng oson:** domeningizni Cloudflare'ga qo'shing (Add a site) va registratoringizda (domenni sotib olgan joy) **nameserver**larni Cloudflare bergan qiymatlarga o'zgartiring. Keyin domen avtomatik ulanadi.
   - Yoki registrator DNS'ida Cloudflare ko'rsatgan **CNAME** yozuvini qo'shing.
3. HTTPS (SSL) sertifikati avtomatik, bepul beriladi (bir necha daqiqada).

---

## 5-qadam: Tekshirish

1. `https://dezsolution.uz` oching — sayt ochilishi kerak.
2. Formaga raqam kiritib yuboring — Telegramingizga xabar kelishi kerak.
3. `https://dezsolution.uz/sitemap.xml` va `/robots.txt` ochilishini tekshiring.
4. [Google Search Console](https://search.google.com/search-console) ga saytni qo'shing va `sitemap.xml` ni yuboring.

---

## Yangilanish kiritish

Kodda biror narsani o'zgartirsangiz, shunchaki qaytadan push qiling — Cloudflare avtomatik yangi versiyani chiqaradi:

```bash
git add .
git commit -m "o'zgarish"
git push
```

---

## Eslatma: lokal test

Lokalда sinash uchun hali ham Node serveridan foydalanishingiz mumkin:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=1105787891 node server.js
```

Cloudflare'da esa `server.js` ishlatilmaydi — uning o'rniga `functions/api/lead.js` ishlaydi. Ikkalasi bir xil vazifani bajaradi.
