const langs = {
  en: require('../../package.nls.json'),
  'zh-cn': require('../../package.nls.zh-cn.json'),
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

  getLocalize(key: string): string {
    let res = this.localize[key] || key
    if (arguments.length > 1) {
      const params = Object.assign([], arguments)
      params.forEach((val, i) => {
        console.log(val)
        if (i > 0) res = res.replace(`\${${i}}`, val)
      })
    }
    return res
  }
}

const localize = new Localize()

localize.init(JSON.parse(process.env.VSCODE_NLS_CONFIG || ''))

export default localize
