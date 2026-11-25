import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  let req = request;
  if (req.startsWith('@/')) {
    req = path.join(ROOT, 'src', req.slice(2));
  } else if (parent && (req.startsWith('./') || req.startsWith('../'))) {
    const base = path.resolve(path.dirname(parent.filename), req);
    if (fs.existsSync(base + '.ts')) req = base + '.ts';
    else if (fs.existsSync(base + '.json')) req = base + '.json';
  }
  return origResolve.call(this, req, parent, isMain, options);
};

const cjsRequire = Module.createRequire(import.meta.url);
cjsRequire.extensions['.ts'] = function compileTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      resolveJsonModule: true,
      esModuleInterop: true,
    },
  });
  return module._compile(transpiled.outputText, filename);
};

const coreRaw = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/coreTools.json'), 'utf8')
);
const { CATEGORIES } = cjsRequire(path.join(ROOT, 'src/data/categories.ts'));
const { buildAllTools } = cjsRequire(path.join(ROOT, 'src/data/expandedToolsBuilder.ts'));

const seeds = buildAllTools(coreRaw);
const totalCount = seeds.length;
const totalLabel = totalCount.toLocaleString('en-US');

const categoryCounts = {};
for (const cat of CATEGORIES) {
  categoryCounts[cat.slug] = 0;
}
for (const s of seeds) {
  categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
}

const compactIndex = seeds.map((s) => [s.id, s.slug, s.title, s.category]);

fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'public/tools-index.json'),
  JSON.stringify(compactIndex),
  'utf8'
);

fs.writeFileSync(
  path.join(ROOT, 'src/data/catalogMeta.json'),
  JSON.stringify({ totalCount, totalLabel, categoryCounts }, null, 2),
  'utf8'
);

console.log(`Synced catalog artifacts: ${totalCount} tools across ${CATEGORIES.length} categories.`);
console.log(
  `public/tools-index.json size: ${(fs.statSync(path.join(ROOT, 'public/tools-index.json')).size / 1024).toFixed(1)} KB`
);
console.log('Category counts:', categoryCounts);
