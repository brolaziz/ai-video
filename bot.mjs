import { setTimeout as wait } from 'node:timers/promises';
import { course } from './public/course.js';
import { isBotToken, telegramApi } from './telegram.mjs';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const appUrl = URL.parse(process.env.MINI_APP_URL ?? '');
if (!isBotToken(token) || appUrl?.protocol !== 'https:' || appUrl.username || appUrl.password) {
  console.error('TELEGRAM_BOT_TOKEN va HTTPS MINI_APP_URL qiymatlarini .env faylida kiriting.');
  process.exit(1);
}

const appButton = { text: 'Mini App’ni ochish', web_app: { url: appUrl.href } };
const stop = new AbortController();
process.on('SIGINT', () => stop.abort());
process.on('SIGTERM', () => stop.abort());

function api(method, body) {
  return telegramApi(token, method, body, { signal: stop.signal, timeout: method === 'getUpdates' ? 35000 : 12000 });
}

async function handle(update) {
  const message = update.message;
  if (!message || message.chat.type !== 'private' || !message.text) return;

  const chatId = message.chat.id;
  const command = message.text.trim().split(/[@\s]/, 1)[0];
  if (command === '/chatid') {
    await api('sendMessage', { chat_id: chatId, text: `Chat ID: ${chatId}` });
    return;
  }

  await api('sendMessage', {
    chat_id: chatId,
    text: 'Kurs sahifasini ochish uchun pastdagi tugmani bosing.',
    reply_markup: { inline_keyboard: [[appButton]] },
  });
}

try {
  await api('deleteMyCommands', {});
  await api('setMyShortDescription', { short_description: course.title });
  await api('setMyDescription', { description: `${course.title}. Kurs sahifasini Mini App orqali oching.` });
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
