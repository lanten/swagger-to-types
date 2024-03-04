import en from '../../package.nls.json'
import zhCN from '../../package.nls.zh-cn.json'

const langs = {
  en,
  'en-us': en,
  'zh-cn': zhCN,
}

class Localize {
  public readonly userLang: string
  public readonly localizeMap: Record<string, string> = {}

  constructor() {
    this.userLang = this.getUserLang()

    if (this.userLang) {
      this.localizeMap = langs[this.userLang] || langs['en-us']
    }
  }

  private getUserLang(): string {
    let langEnvObj: {
      locale?: string
      osLocale?: string
    }

    try {
      langEnvObj = JSON.parse(process.env.VSCODE_NLS_CONFIG || '{}')
    } catch (error) {
      langEnvObj = {}
    }

    return langEnvObj?.locale || 'en-us'
  }

  /**
   * 转换换多语言文本
   * @param key
   * @param params
   */
  public getLocalize(key: string, ...params: string[]): string {
    let res = this.localizeMap[key] || key
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
