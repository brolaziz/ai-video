import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { validateEnrollment } from './public/enrollment-fields.js';

export const enrollmentDbPath = process.env.ENROLLMENT_DB_PATH
  ? resolve(process.env.ENROLLMENT_DB_PATH)
  : fileURLToPath(new URL('./data/enrollments.sqlite', import.meta.url));

let statements;

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
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) STRICT;
    `);
    const columns = database.prepare('PRAGMA table_info(enrollments)').all();
    if (!columns.some(({ name }) => name === 'telegram_username')) {
      database.exec('ALTER TABLE enrollments ADD COLUMN telegram_username TEXT');
    }
    database.exec('COMMIT');

    return {
      insert: database.prepare('INSERT INTO enrollments (name, phone, telegram_username) VALUES (?, ?, ?) ON CONFLICT (phone) DO NOTHING'),
      addTelegram: database.prepare('UPDATE enrollments SET telegram_username = ? WHERE phone = ? AND telegram_username IS NULL'),
    };
  } catch (error) {
    database.close();
    throw error;
  }
}

function saveEnrollment(name, phone, telegramUsername) {
  statements ??= prepareEnrollmentStore();
  const created = statements.insert.run(name, phone, telegramUsername).changes === 1;
  if (!created && telegramUsername) statements.addTelegram.run(telegramUsername, phone);
  return created;
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
    return json(response, created ? 201 : 200, { ok: true });
  } catch (error) {
    console.error('Arizani saqlashda xatolik.', error.code ?? error.name);
    return json(response, 503, { ok: false });
  }
}
