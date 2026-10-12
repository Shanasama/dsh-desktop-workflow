import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {preflight} from '../src/preflight.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'config/evaluation.example.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const fixture = JSON.parse(await readFile(resolve(root, config.fixturePath), 'utf8'));
console.log(JSON.stringify(preflight(config, fixture), null, 2));
