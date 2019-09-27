/**
 * @typescript-eslint 规则参考
 * https://www.npmjs.com/package/@typescript-eslint/eslint-plugin#supported-rules
 */

module.exports = {
  root: true,


  extends: [
    'plugin:@typescript-eslint/recommended',
    // 使用eslint config prettier禁用@typescript eslint/eslint插件中与prettier冲突的eslint规则
    'prettier/@typescript-eslint',
    // 启用 eslint-plugin-prettier ，并将 prettier 错误显示为eslint错误。确保这始终是扩展数组中的最后一个配置。
    'plugin:prettier/recommended',
  ],

  plugins: ['prettier'],

  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
  },

  rules: {
    'no-console': 'off', // 禁用 console
    'no-debugger': 'off', // 禁用 debugger
    'no-alert': 'off', // 禁用 alert

    indent: ['error', 2, { SwitchCase: 1 }], // 强制使用两个空格作为缩进
    quotes: ['error', 'single'], //强制使用单引号
    semi: ['error', 'never'], //强制不使用分号结尾
    'comma-dangle': ['error', 'always-multiline'], // 逗号结束
    'no-param-reassign': 'error', // 禁止对 function 的参数进行重新赋值
    'prettier/prettier': 'error', // prettier
    'prefer-rest-params': 0,

    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-explicit-any': 0, // 禁用 any 类型
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-var-requires': 0,
  },
}
