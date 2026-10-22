// Renders the README screenshots and banners with headless Chrome, driven
// over the DevTools protocol so scripted demo interactions can finish first.
// Usage: pnpm build && pnpm screenshots
// Set CHROME_PATH if Chrome is not installed in the default location.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../docs/demo/server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs', 'images');
const port = 4790;
const debugPort = 9333;

const DEFAULT_CHROME = {
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: 'google-chrome',
};
const chromePath = process.env.CHROME_PATH ?? DEFAULT_CHROME[process.platform] ?? 'google-chrome';

/** [file, page, width, height] — banners embed the screenshots, so they go last. */
const SHOTS = [
  ['floating-window.png', 'sites/travel.html?action=window&pair=auto>en', 1280, 1040],
  ['selection-icon.png', 'sites/tech.html?action=icon&pair=auto>en', 1280, 720],
  ['popup-dark.png', 'sites/popup.html?action=popup&pair=es>en', 360, 545],
  ['popup-light.png', 'sites/popup.html?action=popup&pair=es>en&theme=light', 360, 545],
  ['banner.png', 'banners/hero.html', 1280, 640],
  ['features.png', 'banners/features.html', 1280, 400],
];

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

/** Minimal DevTools protocol session over one page target. */
async function openPage() {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    socket.addEventListener('open', done, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    if (message.error) callback.fail(new Error(message.error.message));
    else callback.done(message.result);
  });
  const send = (method, params = {}) =>
    new Promise((done, fail) => {
      const id = ++nextId;
      pending.set(id, { done, fail });
      socket.send(JSON.stringify({ id, method, params }));
    });
  return { send, close: () => socket.close() };
}

async function capture(page, [file, path, width, height]) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
  await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/demo/${path}` });
  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(100);
    const { result } = await page.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && document.documentElement.dataset.ready === 'true'",
    });
    if (result.value === true) break;
  }
  await sleep(300);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(output, file), Buffer.from(data, 'base64'));
  process.stdout.write(`captured ${file}\n`);
}

await mkdir(output, { recursive: true });
const server = await startServer(port);
const profile = await mkdtemp(join(tmpdir(), 'local-translate-shots-'));
const chrome = spawn(chromePath, [
  '--headless',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
]);

try {
  await waitForDebugger();
  const page = await openPage();
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  // Keeps the page selection highlighted as if the window had focus.
  await page.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  // Animations would otherwise be caught mid-way.
  await page.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  for (const shot of SHOTS) await capture(page, shot);
  page.close();
} finally {
  chrome.kill();
  server.close();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}
