module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    // 'plugin:vue/essential',
    // '@vue/standard'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  rules: {
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 'comma-dangle': 'off',
    // 'eol-last': 'off',
    // 'indent': 'off',
    // 'semi': 'off'
    'no-unused-vars': 'off'
  }
}
