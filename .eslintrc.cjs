module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  overrides: [
    {
      files: ['server/**/*.js'],
      env: { browser: false, node: true, es2020: true },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
    },
  ],
  plugins: ['react-refresh'],
  rules: {
    'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
