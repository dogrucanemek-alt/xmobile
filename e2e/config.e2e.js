module.exports = {
  testEnvironment: 'detox/runners/jest/streamlineTestEnvironment',
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  testRegex: '\\.e2e\\.js$',
  reporters: [
    'default',
    [
      'detox/runners/jest/streamlineReporter',
      {
        logUrl: false,
      },
    ],
  ],
  verbose: true,
};
