import { setTimeout as wait } from 'node:timers/promises';
import { course, questions, supportLink } from './public/course.js';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const appUrl = URL.parse(process.env.MINI_APP_URL ?? '');
if (!token || !/^\d+:[\w-]+$/.test(token) || appUrl?.protocol !== 'https:' || appUrl.username || appUrl.password) {
  console.error('TELEGRAM_BOT_TOKEN va HTTPS MINI_APP_URL qiymatlarini .env faylida kiriting.');
  process.exit(1);
}

const commands = [
  { command: 'start', description: 'Kurs bilan tanishish' },
  { command: 'dastur', description: 'Kurs yo‘nalishlari' },
  { command: 'savollar', description: 'Ko‘p so‘raladigan savollar' },
  { command: 'yozilish', description: 'Kursga yozilish ma’lumotlari' },
  { command: 'yordam', description: 'Aloqa va yordam' },
];

const appButton = { text: 'Mini App’ni ochish', web_app: { url: appUrl.href } };
const stop = new AbortController();
process.on('SIGINT', () => stop.abort());
process.on('SIGTERM', () => stop.abort());

class TelegramError extends Error {
  constructor(method, status, retryAfter) {
    super(`${method}: Telegram API ${status}`);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function api(method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.any([stop.signal, AbortSignal.timeout(method === 'getUpdates' ? 35000 : 12000)]),
    });
    const data = await response.json();
    if (!data.ok) throw new TelegramError(method, data.error_code ?? response.status, data.parameters?.retry_after);
    return data.result;
  } catch (error) {
    if (error instanceof TelegramError) throw error;
    throw new Error(`${method}: Telegram API bilan aloqa uzildi.`);
  }
}

async function send(chatId, message, buttons = []) {
  await api('sendMessage', {
    chat_id: chatId,
    text: message,
    reply_markup: { inline_keyboard: [[appButton], ...buttons] },
  });
}

async function handle(update) {
  const message = update.message;
  if (!message || message.chat.type !== 'private') return;

  const [command, argument] = (message.text ?? '').trim().split(/\s+/, 2);
  const chat = message.chat.id;
  const name = command.split('@')[0];
  const action = name === '/start' && argument === 'enroll' ? '/yozilish' : name;

  switch (action) {
    case '/start':
      return send(chat, `${course.title}\n\n${course.intro}\n\n/dastur — kurs yo‘nalishlari\n/savollar — tez-tez so‘raladigan savollar\n/yozilish — kursga yozilish`);
    case '/dastur':
      return send(chat, `Kurs yo‘nalishlari\n\n${course.topics.map(({ title, description }, index) => `${index + 1}. ${title}\n${description}`).join('\n\n')}\n\n${course.programNote}`);
    case '/savollar':
      return send(chat, questions.map(({ title, description }) => `${title}\n${description}`).join('\n\n'));
    case '/yozilish':
      return send(chat, 'Mini App’ni oching va «Kursga yozilish» bo‘limida ismingiz hamda telefon raqamingizni qoldiring. Telegram username’ingizni ham kiritishingiz mumkin.');
    case '/yordam':
      return supportLink
        ? send(chat, 'Savolingiz bo‘lsa, yordam xizmatiga yozing.', [[{ text: 'Bog‘lanish', url: supportLink }]])
        : send(chat, 'Kurs ma’lumotlari Mini App’da mavjud. Ko‘p so‘raladigan savollar uchun /savollar buyrug‘ini yuboring.');
    default:
      return send(chat, 'Kurs haqida /start orqali tanishing yoki Mini App’ni oching.');
  }
}

try {
  await api('setMyCommands', { commands });
  await api('setMyShortDescription', { short_description: course.title });
  await api('setMyDescription', { description: `${course.title}. ${course.intro} Mini App’da video namunalari va kursga yozilish ma’lumotlari bor.` });
  await api('setChatMenuButton', { menu_button: { type: 'web_app', ...appButton } });
  console.log('Telegram bot ishga tushdi.');

  let offset;
  while (!stop.signal.aborted) {
    try {
      const updates = await api('getUpdates', { timeout: 25, allowed_updates: ['message'], offset });
      for (const update of updates) {
        try {
          await handle(update);
        } catch (error) {
          if (![400, 403].includes(error.status)) throw error;
          console.warn(error.message);
        }
        offset = update.update_id + 1;
      }
    } catch (error) {
      if (stop.signal.aborted) break;
      if ([401, 404, 409].includes(error.status)) throw error;
      console.warn(error.message);
      await wait(Math.max(2, error.retryAfter ?? 0) * 1000, undefined, { signal: stop.signal });
    }
  }
} catch (error) {
  if (!stop.signal.aborted) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
