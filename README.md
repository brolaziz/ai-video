# AI yordamida video yaratish kursi

Kurs sahifasi va Telegram bot.

## Lokal ko‘rish

Node.js 22.13 yoki undan yangi versiya kerak. Loyiha papkasida `npm run dev` buyrug‘ini ishga tushiring va [lokal sahifani](http://127.0.0.1:4173/) oching. Sintaksis tekshiruvi uchun `npm run check` buyrug‘idan foydalaning.

## Arizalarni ko‘rish

«Kursga yozilish» formasidagi ism, telefon raqami va ixtiyoriy Telegram username `data/enrollments.sqlite` faylida saqlanadi. Bir telefon raqami uchun bitta ariza saqlanadi. Arizalarni ko‘rish uchun serverdagi loyiha papkasida `npm run leads` buyrug‘ini bajaring. Hostingda baza doimiy diskda saqlanishi uchun `ENROLLMENT_DB_PATH` sozlamasini shu diskdagi fayl yo‘liga o‘rnating.

## Telegramga ulash

1. Forma va sahifani birga ishga tushirish uchun `npm start` buyrug‘ini ommaviy HTTPS proksi ortida bajaring va hostingga mos `HOST` hamda `PORT` qiymatlarini kiriting.
2. `.env.example` nusxasini `.env` nomi bilan saqlang. `TELEGRAM_BOT_TOKEN` uchun BotFather bergan tokenni, `MINI_APP_URL` uchun ommaviy HTTPS manzilini kiriting. Tokenni faqat serverdagi `.env` yoki hostingning maxfiy sozlamalarida saqlang.
3. `npm run bot` buyrug‘ini ishga tushiring. Bot `/start`, `/dastur`, `/savollar`, `/yozilish` va `/yordam` buyruqlariga javob beradi. Bot profiliga `bot-avatar.png` rasmini yuklang. Telegram profilidagi Launch App tugmasi kerak bo‘lsa, BotFather orqali Main Mini App manzilini sozlang.
4. Narx, darslar va yordam uchun Telegram manzili tasdiqlanganda `public/course.js` faylini yangilang. Avtomatik to‘lov va darslarga avtomatik kirish hali ulanmagan.

## Demo materiallar

Loyihaga uchta ImageGen tasviri va ulardan tayyorlangan olti soniyalik ovozsiz animatsiyalar kiritildi. Rasmlar `public/assets/mountain.webp`, `public/assets/product.webp` va `public/assets/story.webp` fayllarida.

- «Qor chizig‘i» uchun Tyan-Shan muzligi qarshisida turgan ko‘k kurtkali sayohatchi tasvirlandi.
- «Studiyadagi mahsulot» uchun moviy studiya yorug‘idagi kumush quloqchinlar tasvirlandi.
- «Samarqand oqshomi» uchun quyosh botayotgan paytda moviy koshinli hovlidan o‘tayotgan sayohatchi tasvirlandi.

Botni jonli Telegram klientida, shu jumladan Telegram Ads uchun ochiladigan `/start` yo‘lini tekshirish uchun HTTPS manzil va BotFather tokeni kerak.
