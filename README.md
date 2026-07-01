# DezSolution — dezinfeksiya sotuv sayti

Dezinfeksiya kompaniyasi uchun **bir sahifali landing page** (Google Ads uchun moslashtirilgan) va telefon raqam qabul qiluvchi oddiy backend.

Dizayn `DESIGN.md` (Mintlify uslubi) asosida: oq fon, bitta yashil urg'u (#0c8c5e), Inter shrifti, kvadrat burchaklar.

## Fayllar

| Fayl | Vazifasi |
|------|----------|
| `index.html` | Landing sahifa (o'zbek tilida) |
| `css/styles.css` | Uslublar (DESIGN.md tokenlari asosida) |
| `app.js` | Formalarni backendga yuborish |
| `server.js` | Backend — telefon raqamlarni qabul qiladi va saqlaydi |
| `package.json` | Loyiha ma'lumoti |
| `leads.json` | Kelgan buyurtmalar (avtomatik yaratiladi) |

## Formalar (3 ta)

Sahifada telefon raqam oluvchi **3 ta forma** bor, hammasi bitta backendga yuboradi:
1. **Hero** — yuqoridagi tez chaqiruv formasi
2. **Mid-page** — ism + telefon + xizmat turi bilan to'liq forma
3. **Footer CTA** — pastdagi yakuniy chaqiruv formasi

## Ishga tushirish

Node.js (14+) o'rnatilgan bo'lsa, hech qanday `npm install` shart emas — faqat:

```bash
node server.js
```

Keyin brauzerda oching: <http://localhost:3000>

Portni o'zgartirish:
```bash
PORT=8080 node server.js
```

## Buyurtmalar qayerga tushadi?

- Har bir yuborilgan raqam `leads.json` fayliga saqlanadi.
- **Telegram'ga bildirishnoma** (ixtiyoriy) — bot token va chat ID bering:

```bash
TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_CHAT_ID=987654321 node server.js
```

Bot yaratish: Telegramda [@BotFather](https://t.me/BotFather) → `/newbot`.
Chat ID'ni bilish: botga xabar yozib, `@getmyid_bot` dan foydalaning.

## Sozlash kerak bo'lgan joylar

`index.html` ichida:
- Telefon raqam: `+998 90 123 45 67` (bir necha joyda — `tel:` va matnlar)
- Telegram/email havolalar (footer)
- **Google Ads gtag** — `<head>` dagi izohga olingan blokni oching va `AW-XXXXXXXXX` ni o'z konversiya ID'ingizga almashtiring. Konversiya `generate_lead` hodisasi orqali `app.js` da yuboriladi.

## Ishlab chiqarishga (production)

- Domenni (`dezsolution.uz`) serverga yo'naltiring.
- HTTPS uchun reverse-proxy (masalan Nginx + Let's Encrypt) tavsiya etiladi.
- Serverni doim ishlab turishi uchun `pm2` ishlatishingiz mumkin:
  ```bash
  npm i -g pm2 && pm2 start server.js --name dezsolution
  ```
