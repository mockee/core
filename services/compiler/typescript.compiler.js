const watch = require('node-watch');
const { format } = require('util');
const { exec } = require('shelljs');
const { ReplaySubject } = require('rxjs');
const projectConfig = require('../../pregular.json');
const getConfigByPath = require('../../utils/get-config-by-path');

const browserPackages = getConfigByPath(projectConfig, 'compile.browser.packages', 'pregular.json');
const globalPackages = getConfigByPath(projectConfig, 'compile.global.packages', 'pregular.json');
const nodePackages = getConfigByPath(projectConfig, 'compile.node.packages', 'pregular.json');
const srvPackages = getConfigByPath(projectConfig, 'compile.services.packages', 'pregular.json');

const compilerIdle$ = new ReplaySubject();

// options
const watchOptions = {
  recursive: true,
  filter: /^((?!(node_modules|\.cjs|\.js|\.d\.ts)).)*$/, // only .ts files are allowed
};
const shellOptions = {
  async: true,
};

// npm scripts: compile all files to .d.ts, .js, .cjs
// @todo: allow to pass --src-dir --out-dir so that we can use it for services
const execBabelCjsModuleAll =
  'npm run compile:cjs:all --src-dir="./packages/node" --out-dir="./packages/node"';
const execBabelJsModuleAll =
  'npm run compile:mjs:all --src-dir="./packages/browser" --out-dir="./packages/browser"';
const execTsDeclarationsAll = 'npm run compile:dec:all --src-files=./packages/**/pkg-*/src/*.ts';

// npm scripts: compile single file to .d.ts, .js, .cjs
const execBabelJsModuleSingle = 'npm run compile:mjs:single --src-file=%s --out-file=%s';
const execBabelCjsModuleSingle = 'npm run compile:cjs:single --src-file=%s --out-file=%s';
const execTsDeclarationsSingle = 'npm run compile:dec:single --src-file=%s';

// npm scripts: combine tasks ('& ' => run in shell parallel)
const execBabel = [execBabelCjsModuleAll, execBabelJsModuleAll, execTsDeclarationsAll].join('& ');

const replaceExtToJs = name => name.replace('.ts', '.js');
const replaceExtToDTs = name => name.replace('.ts', '.d.ts');
const compiledMessage = name => console.log('Successfully compiled 1 file with Babel: %s', name);
const hasError = (code, stderr) => code !== 0 && stderr;
const execDone = (name, code, stderr) => {
  return hasError(code, stderr) ? undefined : compiledMessage(replaceExtToDTs(name));
};

// First compile all files to commonJs, moduleJs and d.ts
exec(execBabel, (code, stdout, stderr) => {
  // notify all files are rendered
  compilerIdle$.next(true);
  compilerIdle$.complete();

  // watch and compile single esModule file
  watch(browserPackages, watchOptions, (_, name) =>
    exec(format(execBabelJsModuleSingle, name, replaceExtToJs(name)), shellOptions, code =>
      execDone(name, code, stderr),
    ),
  );

  // watch and compile single commonJs file
  watch(nodePackages, watchOptions, (_, name) =>
    exec(format(execBabelCjsModuleSingle, name, replaceExtToJs(name)), shellOptions, code =>
      execDone(name, code, stderr),
    ),
  );

  // watch and compile single typed file
  watch(globalPackages, watchOptions, (_, name) => {
    exec(format(execTsDeclarationsSingle, name), shellOptions, code =>
      execDone(name, code, stderr),
    );
  });
});

module.exports.typescriptCompiler = compilerIdle$.asObservable();
