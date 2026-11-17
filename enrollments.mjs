import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { validateEnrollment } from './public/enrollment-fields.js';
import { isBotToken, telegramApi } from './telegram.mjs';

export const enrollmentDbPath = process.env.ENROLLMENT_DB_PATH
  ? resolve(process.env.ENROLLMENT_DB_PATH)
  : fileURLToPath(new URL('./data/enrollments.sqlite', import.meta.url));

const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const adminChatId = Number(process.env.TELEGRAM_ADMIN_CHAT_ID);
const notificationsEnabled = isBotToken(botToken) && Number.isSafeInteger(adminChatId) && adminChatId > 0;
let statements;
let sendingNotifications = false;
let retryNotificationsAfter = 0;

function prepareEnrollmentStore() {
  mkdirSync(dirname(enrollmentDbPath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(enrollmentDbPath);
  try {
    database.exec(`
      PRAGMA busy_timeout = 3000;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        telegram_username TEXT,
        telegram_pending INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) STRICT;
    `);
    const columns = database.prepare('PRAGMA table_info(enrollments)').all();
    if (!columns.some(({ name }) => name === 'telegram_username')) {
      database.exec('ALTER TABLE enrollments ADD COLUMN telegram_username TEXT');
    }
    if (!columns.some(({ name }) => name === 'telegram_pending')) {
      database.exec('ALTER TABLE enrollments ADD COLUMN telegram_pending INTEGER NOT NULL DEFAULT 0');
    }
    database.exec('CREATE INDEX IF NOT EXISTS enrollments_telegram_pending ON enrollments(id) WHERE telegram_pending = 1; COMMIT');

    return {
      insert: database.prepare('INSERT INTO enrollments (name, phone, telegram_username, telegram_pending) VALUES (?, ?, ?, ?) ON CONFLICT (phone) DO NOTHING'),
      addTelegram: database.prepare('UPDATE enrollments SET telegram_username = ? WHERE phone = ? AND telegram_username IS NULL'),
      pendingNotifications: database.prepare('SELECT id, name, phone, telegram_username FROM enrollments WHERE telegram_pending = 1 ORDER BY id LIMIT 10'),
      markNotified: database.prepare('UPDATE enrollments SET telegram_pending = 0 WHERE id = ?'),
    };
  } catch (error) {
    database.close();
    throw error;
  }
}

function saveEnrollment(name, phone, telegramUsername) {
  statements ??= prepareEnrollmentStore();
  const created = statements.insert.run(name, phone, telegramUsername, Number(notificationsEnabled)).changes === 1;
  if (!created && telegramUsername) statements.addTelegram.run(telegramUsername, phone);
  return created;
}

async function flushTelegramNotifications() {
  if (!notificationsEnabled || sendingNotifications || Date.now() < retryNotificationsAfter) return;
  if (!statements && !existsSync(enrollmentDbPath)) return;

  sendingNotifications = true;
  try {
    statements ??= prepareEnrollmentStore();
    for (const lead of statements.pendingNotifications.all()) {
      const lines = [`Yangi kurs arizasi #${lead.id}`, `Ism: ${lead.name}`, `Telefon: ${lead.phone}`];
      if (lead.telegram_username) lines.push(`Telegram: ${lead.telegram_username}`);
      await telegramApi(botToken, 'sendMessage', { chat_id: adminChatId, text: lines.join('\n') });
      statements.markNotified.run(lead.id);
    }
  } catch (error) {
    retryNotificationsAfter = Date.now() + Math.max(30, error.retryAfter ?? 0) * 1000;
    console.warn(`Telegram arizasi navbatda qoldi (${error.status ?? error.name}).`);
  } finally {
    sendingNotifications = false;
  }
}

export function startEnrollmentNotifications() {
  if (!notificationsEnabled) return;
  setInterval(flushTelegramNotifications, 30000).unref();
  void flushTelegramNotifications();
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(body));
}

export async function handleEnrollment(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false });
  }

  const mediaType = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType !== 'application/json') return json(response, 415, { ok: false });

  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 4096) {
      request.resume();
      return json(response, 413, { ok: false });
    }
    chunks.push(chunk);
  }

  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return json(response, 400, { ok: false });
  }

  const { name, phone, telegramUsername, errors } = validateEnrollment(input);
  if (Object.keys(errors).length) return json(response, 422, { ok: false, errors });

  try {
    const created = saveEnrollment(name, phone, telegramUsername);
    json(response, created ? 201 : 200, { ok: true });
    if (created) void flushTelegramNotifications();
  } catch (error) {
    console.error('Arizani saqlashda xatolik.', error.code ?? error.name);
    return json(response, 503, { ok: false });
  }
}
