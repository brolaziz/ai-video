export function validateEnrollment(input) {
  const rawName = typeof input?.name === 'string' ? input.name : '';
  const rawPhone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  const rawTelegram = typeof input?.telegramUsername === 'string' ? input.telegramUsername.trim() : '';
  const name = rawName.trim().replace(/\s+/g, ' ');
  const compact = rawPhone.replace(/[\s().-]/g, '');
  let phone = '';
  const errors = {};

  if (name.length > 80 || !/^\p{L}[\p{L}\p{M} '\u2018\u2019\u02bb\u02bc-]*$/u.test(name) || (name.match(/\p{L}/gu)?.length ?? 0) < 2) {
    errors.name = 'Ismingizni kamida ikki harf bilan kiriting.';
  }

  if (rawPhone.length <= 32) {
    if (/^\d{9}$/.test(compact)) phone = `+998${compact}`;
    else if (/^\+?998\d{9}$/.test(compact)) phone = `+${compact.replace(/^\+/, '')}`;
    else if (/^\+(?!998)[1-9]\d{7,14}$/.test(compact)) phone = compact;
  }

  if (!phone) errors.phone = 'Telefon raqamingizni +998 90 123 45 67 shaklida kiriting.';

  let telegramUsername = null;
  if (rawTelegram && /^@?[a-zA-Z0-9_]{1,32}$/.test(rawTelegram)) {
    telegramUsername = `@${rawTelegram.replace(/^@/, '')}`;
  } else if (rawTelegram || (input?.telegramUsername != null && typeof input.telegramUsername !== 'string')) {
    errors.telegramUsername = 'Telegram username’ni @username shaklida kiriting.';
  }

  return { name, phone, telegramUsername, errors };
}
