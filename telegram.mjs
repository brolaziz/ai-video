export class TelegramError extends Error {
  constructor(method, status, retryAfter) {
    super(`${method}: Telegram API ${status}`);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function isBotToken(token) {
  return typeof token === 'string' && /^\d+:[\w-]+$/.test(token);
}

export async function telegramApi(token, method, body, { signal, timeout = 12000 } = {}) {
  const deadline = AbortSignal.timeout(timeout);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new TelegramError(method, data.error_code ?? response.status, data.parameters?.retry_after);
    return data.result;
  } catch (error) {
    if (error instanceof TelegramError) throw error;
    throw new Error(`${method}: Telegram API bilan aloqa uzildi.`);
  }
}
