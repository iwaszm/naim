import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('node_modules/@mediapipe/tasks-vision/wasm');
const target = resolve('public/vendor/mediapipe/tasks-vision');
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true, force: true });
