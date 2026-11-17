# AI yordamida video yaratish kursi

Kurs sahifasi va Telegram bot.

## Lokal ko‘rish

Node.js 22.13 yoki undan yangi versiya kerak. Loyiha papkasida `npm run dev` buyrug‘ini ishga tushiring va [lokal sahifani](http://127.0.0.1:4173/) oching. Sintaksis tekshiruvi uchun `npm run check` buyrug‘idan foydalaning.

## Arizalarni ko‘rish

«Kursga yozilish» formasidagi ism, telefon raqami va ixtiyoriy Telegram username `data/enrollments.sqlite` faylida saqlanadi. Bir telefon raqami uchun bitta ariza saqlanadi. Arizalarni ko‘rish uchun serverdagi loyiha papkasida `npm run leads` buyrug‘ini bajaring. Hostingda baza doimiy diskda saqlanishi uchun `ENROLLMENT_DB_PATH` sozlamasini shu diskdagi fayl yo‘liga o‘rnating.

## Telegramga ulash

1. Forma va sahifani birga ishga tushirish uchun `npm start` buyrug‘ini ommaviy HTTPS proksi ortida bajaring va hostingga mos `HOST` hamda `PORT` qiymatlarini kiriting.
2. `.env.example` nusxasini `.env` nomi bilan saqlang. `TELEGRAM_BOT_TOKEN` uchun BotFather bergan tokenni, `MINI_APP_URL` uchun ommaviy HTTPS manzilini kiriting. Tokenni faqat serverdagi `.env` yoki hostingning maxfiy sozlamalarida saqlang.
3. `npm run bot` buyrug‘ini ishga tushiring. `/start` javobida «Mini App’ni ochish» tugmasi chiqadi. BotFather orqali profilga `bot-avatar.png` rasmini yuklang. Telegram profilidagi Launch App tugmasi kerak bo‘lsa, BotFather orqali Main Mini App manzilini sozlang.
4. Narx yoki darslar o‘zgarsa, `public/course.js` faylini yangilang.

### Railway’da arizalar va to‘lov bo‘yicha yozish

1. O‘z akkauntingizdan botga `/start`, keyin `/chatid` yuboring va qaytgan raqamni oling.
2. Sayt servisining **Variables** bo‘limida `TELEGRAM_ADMIN_CHAT_ID` uchun shu raqamni va `TELEGRAM_BOT_TOKEN` uchun bot servisidagi tokenni kiriting. Yangi ariza avval bazaga yoziladi, keyin bot sizga xabar yuboradi. Telegram vaqtincha ishlamasa, xabar navbatda qoladi va qayta yuboriladi.
3. Sayt servisining **Variables** bo‘limida `TELEGRAM_PAYMENT_USERNAME` uchun o‘z ommaviy Telegram username’ingizni kiriting. «To‘lov qilish» tugmasi akkauntingiz bilan suhbatni ochadi va «To‘lov qilmoqchiman» matnini tayyorlaydi. Xabarni xaridor yuboradi.

## Demo materiallar

Bosh ekrandagi «Qor chizig‘i» demosida Tyan-Shan muzligi qarshisida turgan sayohatchi tasvirlangan.

«Tasvir namunalari» galereyasida to‘rtta vaqtinchalik 3840 × 2160 WebP kadr bor. Brauzer ekran o‘lchamiga qarab tegishli 1280 × 720 nusxani tanlay oladi.

| Uslub | 4K fayl |
| --- | --- |
| Fantasy | `public/assets/gallery/fantasy-4k.webp` |
| Tarixiy | `public/assets/gallery/historical-4k.webp` |
| Mo‘yqalam uslubi | `public/assets/gallery/brush-4k.webp` |
| Realizm | `public/assets/gallery/realist-4k.webp` |

<details>
<summary>ImageGen promptlari</summary>

**fantasy**

```text
Wide cinematic fantasy concept-art still for an AI visual course gallery. In a teal midnight valley, a huge ring of floating ancient stone above a reflective lake, distant ridges and clouds, tiny lone traveler at shore gives scale. Blue and sea-green palette with fine warm slivers of light. Deliberate clear film composition, polished environmental concept art, captivating even as a small gallery thumbnail. Render wide UHD 3840x2160 16:9 if available, scenery keeps its main subject in the middle 70%. Full bleed, no letters, no border, no watermark.
```

**historical**

```text
Historical cinematic reconstruction for a Central Asian visual-course gallery: a Silk Road caravan entering a Timurid-era Samarkand courtyard, patterned turquoise glazed tiles, ochre walls, sunlit dust, riders and merchants in plausible period robes, restrained market atmosphere. Painterly film color grading but realistic physical detail, late afternoon amber light contrasted with deep turquoise. A clear wide establishing shot. Render wide UHD 3840x2160 16:9 if available, with important subjects composing the central width. No modern things, logos, text, or border.
```

**brush**

```text
Painterly visual style demo for a creative course gallery. Bold visible impressionist oil brushwork and impasto texture, a quiet Uzbek orchard just after a warm summer rain, a small brick house on the right reflected in a broad puddle, blossoms and rows of dark cypress. Confident irregular marks, expressive pools of periwinkle, mauve, and gold, textured canvas appearance, fine-art painting and no photorealism. Horizontal widescreen 16:9 UHD 3840x2160 if available, keep primary elements comfortably centered. No title, signage, text, artist signature, or watermark.
```

**realist**

```text
Photoreal editorial cinematography for a style gallery: a contemporary rain-slicked Tashkent street at blue hour seen from curb height, lone yellow city bus in the middle distance, wet surfaces reflecting warm storefront light, a few natural pedestrians, pale concrete modernism and plane trees, grounded lens photograph with subtle grain and natural color contrast. Human everyday reality, restrained realistic lighting and physically convincing detail. Wide UHD 3840x2160 16:9 if available, clear balanced composition with hero scene kept central. No readable lettering, typography, logo, watermarks or border.
```

</details>

Botni jonli Telegram klientida, shu jumladan Telegram Ads uchun ochiladigan `/start` yo‘lini tekshirish uchun HTTPS manzil va BotFather tokeni kerak.
