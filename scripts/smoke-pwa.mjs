import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
const sw = readFileSync(resolve(dist, 'sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.webmanifest'), 'utf8'));
const base = html.includes('href="/naim/manifest.webmanifest"') ? '/naim/' : '/';

assert.match(html, new RegExp(`href="${base.replaceAll('/', '\\/')}manifest\\.webmanifest"`));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
assert.doesNotMatch(sw, /__BUILD_ID__/);
assert.match(sw, /models\/face_landmarker\.task/);
assert.match(sw, /vision_wasm_internal\.wasm/);

for (const [, url] of html.matchAll(/(?:src|href)="([^\"]+\/assets\/[^\"]+)"/g)) {
  assert.ok(url.startsWith(base), `Asset outside base: ${url}`);
  assert.ok(existsSync(resolve(dist, url.slice(base.length))), `Missing asset: ${url}`);
}
for (const name of ['models/face_landmarker.task', 'vendor/mediapipe/tasks-vision/vision_wasm_internal.wasm', 'icons/naim-192.png', 'icons/naim-512.png']) {
  assert.ok(existsSync(resolve(dist, name)), `Missing core PWA file: ${name}`);
}
console.log(`PWA package ok (${base} base)`);
