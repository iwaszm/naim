import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve('dist/sw.js');
const template = readFileSync(path, 'utf8');
const hash = createHash('sha256')
  .update(readFileSync(resolve('dist/index.html')))
  .update(readFileSync(resolve('dist/models/face_landmarker.task')))
  .update(template)
  .digest('hex').slice(0, 12);
writeFileSync(path, template.replace('__BUILD_ID__', hash));
