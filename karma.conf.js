module.exports = config => {
  config.set({
    basePath: '',
    frameworks: [
      'esm',
      'jasmine',
    ],
    files: [
      file('packages/pg-browser-*/**/*.spec.js', config),
    ],
    browsers: [
      'Chrome',
      'Firefox',
      'Safari',
      // 'Opera' Error compiling: [BABEL] Unknown version 67 of Opera
      // 'Opera',
    ],
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
        presets: [
            "@babel/preset-typescript",
        ],
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

const file = (filePattern, config) => ({
  pattern: config.grep ? config.grep : filePattern,
  type: 'module',
});

const excludeFromCompilation = [
  '**/node_modules/**/*.js',
  '**/node_modules/**/*.ts',
];

const customPolyfills = [
  {
    name: 'document-register-element',
    path: require.resolve('document-register-element'),
    test: "!('customElements' in window)",
  },
];