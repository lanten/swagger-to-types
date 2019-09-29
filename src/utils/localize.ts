import path from 'path'
import fs from 'fs'

class Localize {
  public locale: string
  public localize: { [key: string]: any }

  constructor() {
    this.locale = ''
    this.localize = {}

    this.init(JSON.parse(process.env.VSCODE_NLS_CONFIG || ''))
  }

  public init({ locale }: { locale: string }) {
    this.locale = locale
    const localName = !locale || locale === 'en' ? '' : '.' + locale
    const localePackagePath = path.join(__dirname, `package.nls${localName}.json`)

    console.log('asdasdasdsad', $ext.WORKSPACE_PATH, localePackagePath)
    // if (fs.existsSync(localePackagePath)) {
    //   this.localize = require(localePackagePath)
    // } else {
    //   this.localize = require(path.resolve(__dirname, '../../package.nls.json'))
    // }
  }

  public getLocalize(key: string) {
    let res = this.localize[key] || key
    if (arguments.length > 1) {
      const params = Object.assign([], arguments)
      params.forEach((val, i) => {
        if (i > 0) res = res.replace(`{${i}}`, val)
      })
    }
    return res
  }
}

export default Localize
