/**
 * 中划线转驼峰
 * @param {String} str
 * @param {Boolean} c 首字母是否大写
 */
export function toCamel(str: string, c?: boolean, s = '-'): string {
  const REG = new RegExp(`([^${s}])(?:${s}+([^${s}]))`, 'g')
  let strH = str.replace(REG, (_, $1, $2) => $1 + $2.toUpperCase())
  if (c) strH = strH.slice(0, 1).toUpperCase() + strH.slice(1)
  return strH
}
