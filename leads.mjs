import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const enrollmentDbPath = process.env.ENROLLMENT_DB_PATH
  ? resolve(process.env.ENROLLMENT_DB_PATH)
  : fileURLToPath(new URL('./data/enrollments.sqlite', import.meta.url));

if (!existsSync(enrollmentDbPath)) {
  console.log('Hozircha arizalar yo‘q.');
} else {
  const database = new DatabaseSync(enrollmentDbPath, { readOnly: true });
  try {
    const columns = database.prepare('PRAGMA table_info(enrollments)').all();
    const telegram = columns.some(({ name }) => name === 'telegram_username') ? 'telegram_username' : 'NULL';
    const rows = database.prepare(`SELECT name AS Ism, phone AS Telefon, ${telegram} AS Telegram, created_at AS "Vaqt (UTC)" FROM enrollments ORDER BY id DESC`).all();
    if (rows.length) console.table(rows);
    else console.log('Hozircha arizalar yo‘q.');
  } finally {
    database.close();
  }
}
