module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Disallow all console usage except console.warn and console.error
    'no-console': "off",
    
    // General rules
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Code style - let Prettier handle formatting
    'indent': 'off', // Prettier handles indentation
    'quotes': 'off', // Prettier handles quotes
    'semi': 'off', // Prettier handles semicolons
    'no-trailing-spaces': 'off', // Prettier handles trailing spaces
    'eol-last': 'off', // Prettier handles end of line
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.d.ts',
    // Exclude files that are in .npmignore (but keep scripts/ for linting)
    'demo/',
    'examples/',
    'docs-site/',
    'tests/',
    'test-results/',
    'playwright-report/',
    'public/',
    // Exclude config files that are typically not linted
    'rollup.config.js',
    'vite.config.js',
    'e2e.server.config.js',
    'vitest.config.ts',
    'playwright.config.ts',
    'typedoc.json',
    // Exclude build artifacts
    '*.map',
    '*.d.ts.map',
  ],
};