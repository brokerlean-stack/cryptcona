const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
module.exports = function createLoader(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (!path.extname(file)) file += fs.existsSync(file + '.ts') ? '.ts' : '.js';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, allowJs: true } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, console, process, Date, Map, Promise, fetch, AbortSignal, setTimeout, clearTimeout, structuredClone, ...globals,
      require(name) {
        if (name in overrides) return overrides[name];
        if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2)));
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
        return require(name);
      },
    }, { filename: file });
    return module.exports;
  }
  return load;
};
