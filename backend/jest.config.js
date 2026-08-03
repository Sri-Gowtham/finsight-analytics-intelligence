/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  // ESM support: Jest picks up .js files and runs them through its ESM loader
  // when NODE_OPTIONS=--experimental-vm-modules is set (see package.json "test" script).
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/setup.js',
};
