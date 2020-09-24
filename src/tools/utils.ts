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

/**
 * 格式化日期
 * @param d
 * @param format 'YYYY-MM-DD H:I:S.MS'
 */
export function formatDate(date: Date = new Date(), format = 'YYYY-MM-DD H:I:S.MS') {
  const obj = {
    YYYY: date.getFullYear().toString().padStart(4, '0'),
    MM: (date.getMonth() + 1).toString().padStart(2, '0'),
    DD: date.getDate().toString().padStart(2, '0'),
    H: date.getHours().toString().padStart(2, '0'),
    I: date.getMinutes().toString().padStart(2, '0'),
    S: date.getSeconds().toString().padStart(2, '0'),
    MS: date.getMilliseconds().toString().padStart(3, '0'),
  }

  return format.replace(/(YYYY|MM|DD|H|I|S|MS)/g, (_, $1) => {
    return obj[$1]
  })
}
