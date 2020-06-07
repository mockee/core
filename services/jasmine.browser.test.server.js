const projectConfig = require('../pregular.json');
const getConfigByPath = require('../utils/get-config-by-path');

const filePatterns = getConfigByPath(projectConfig, 'test.browser.pattern', 'pregular.json');
const excludeFromCompilation = ['**/node_modules/**/*.js', '**/node_modules/**/*.ts'];

const file = (filePattern, config) => ({
  pattern: config.grep ? config.grep : filePattern,
  type: 'module',
});

const customPolyfills = [
  {
    name: 'document-register-element',
    path: require.resolve('document-register-element'),
    test: '!("customElements" in window)',
  },
];

const createFilePatterns = (patterns, config = {}) => {
  return patterns.map(pattern => file(pattern, config));
};

// karma.conf
module.exports = config => {
  config.set({
    basePath: '../',
    frameworks: ['esm', 'jasmine'],
    files: [...createFilePatterns(filePatterns, config)],
    browsers: [
      'Chrome',
      'Firefox',
      // 'Safari', // Note: strange behavior, it tries to open file with redirection
    ],
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
    },
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-opera-launcher',
      'karma-safari-launcher',
      require.resolve('@open-wc/karma-esm'),
    ],
    esm: {
      babel: true,
      customBabelConfig: {
        presets: ['@babel/preset-typescript'],
      },
      babelExclude: excludeFromCompilation,
      babelModernExclude: excludeFromCompilation,
      babelModuleExclude: excludeFromCompilation,

      nodeResolve: true,
      fileExtensions: ['.js'],
      preserveSymlinks: true,

      polyfills: {
        custom: customPolyfills,
      },
    },
  });
  return config;
};