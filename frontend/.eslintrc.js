module.exports = {
  root: true,
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript'
  ],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "no-alert": "error",
    "no-multi-spaces": "warn"
  }
}
