// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'proxy-deploy/*', 'app-example/*'],
  },
  {
    files: ['**/__tests__/**', 'jest.setup.js', 'jest.config.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    files: ['e2e/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
        element: 'readonly',
        by: 'readonly',
        device: 'readonly',
        waitFor: 'readonly',
        detox: 'readonly',
      },
    },
  },
]);
