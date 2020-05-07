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

  getLocalize(key: string, ...params: string[]): string {
    let res = this.localize[key] || key
    if (arguments.length > 1) {
      const params = Object.assign([], arguments)
      params.forEach((val, i) => {
        if (i > 0) res = res.replace(`\${${i}}`, val)
      })
    }
    return res
  }
}

const localize = new Localize()

localize.init(JSON.parse(process.env.VSCODE_NLS_CONFIG || ''))

export default localize
