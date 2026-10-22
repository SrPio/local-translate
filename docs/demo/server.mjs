// Static server for the demo pages: serves the built extension (dist/) and
// the demo folder, with stable aliases for the hashed bundle names.
import { readdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(root, 'dist');
const docs = join(root, 'docs');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const ALIASES = {
  '/app/popup.js': /^index\.html-.*\.js$/,
  '/app/popup.css': /\.css$/,
  '/app/content.js': /^src-content-index\.tsx-.*\.js$/,
};

async function resolvePath(pathname) {
  const alias = ALIASES[pathname];
  if (alias) {
    const assets = await readdir(join(dist, 'assets'));
    const match = assets.find((name) => alias.test(name));
    if (!match) throw new Error(`Missing bundle for ${pathname}; run pnpm build first.`);
    return join(dist, 'assets', match);
  }
  // Chunks imported relatively by the aliased bundles.
  if (pathname.startsWith('/app/')) return join(dist, 'assets', pathname.slice('/app/'.length));
  if (pathname.startsWith('/demo/') || pathname.startsWith('/images/')) return join(docs, pathname);
  return join(dist, pathname);
}

export function startServer(port = 4790) {
  const server = createServer(async (request, response) => {
    try {
      const { pathname } = new URL(request.url ?? '/', 'http://localhost');
      const file = await resolvePath(decodeURIComponent(pathname));
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  return new Promise((done) => server.listen(port, '127.0.0.1', () => done(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4790);
  await startServer(port);
  process.stdout.write(`Demo server on http://127.0.0.1:${port}/demo/\n`);
}
