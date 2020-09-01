import en from '../../package.nls.json'
import zhCN from '../../package.nls.zh-cn.json'

const langs = {
  en,
  'zh-cn': zhCN,
}

class Localize {
  public locale: string
  public localize: any

  constructor() {
    this.locale = ''
    this.localize = {}
  }

  init({ locale }: { locale: string }) {
    this.locale = locale
    this.localize = langs[locale]
  }

  /**
   * 转换换多语言文本
   * @param key
   * @param params
   */
  getLocalize(key: string, ...params: string[]): string {
    let res = this.localize[key] || key
    if (params.length) {
      params.forEach((val, i) => {
        res = res.replace(`\${${i + 1}}`, val)
      })
    }
    return res
  }
}

/** 多语言 */
export const localize = new Localize()

localize.init(JSON.parse(process.env.VSCODE_NLS_CONFIG || ''))
