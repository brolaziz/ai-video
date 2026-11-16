import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { handleEnrollment } from './enrollments.mjs';

const root = fileURLToPath(new URL('./public', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return Number.isSafeInteger(start) && start <= end ? { start, end } : null;
}

createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' https://telegram.org; style-src 'self'; img-src 'self'; media-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'");

  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/enrollments') {
      await handleEnrollment(request, response);
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const type = types[extname(file)];
    if (!file.startsWith(`${root}${sep}`) || !type) {
      response.writeHead(404).end();
      return;
    }

    const fileInfo = await stat(file);
    if (!fileInfo.isFile()) {
      response.writeHead(404).end();
      return;
    }

    const size = fileInfo.size;
    const isVideo = type === 'video/mp4';
    const range = isVideo && request.headers.range ? byteRange(request.headers.range, size) : undefined;
    if (isVideo) response.setHeader('Accept-Ranges', 'bytes');
    if (range === null) {
      response.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }

    if (range) response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    const length = range ? range.end - range.start + 1 : size;
    response.writeHead(range ? 206 : 200, { 'Content-Type': type, 'Content-Length': length });
    if (request.method === 'HEAD') response.end();
    else pipeline(createReadStream(file, range), response, () => {});
  } catch (error) {
    if (response.destroyed) return;
    const status = error instanceof URIError || error instanceof TypeError ? 400 : error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500;
    response.writeHead(status).end();
  }
}).listen(Number(process.env.PORT ?? 4173), process.env.HOST ?? '127.0.0.1', function () {
  const { address, port } = this.address();
  console.log(`Kurs sahifasi http://${address}:${port}`);
});
