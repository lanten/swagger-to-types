import vscode, { workspace } from 'vscode'
import fs from 'fs'
import path from 'path'

import {
  LOCAL_CONFIG_PATH,
  CONFIG_LIST,
  EXT_NAME,
  PUBLISHER,
  mkdirRecursive,
  localize,
  log,
  CONFIG_GROUP,
  // WORKSPACE_PATH,
} from '.'

export interface SwaggerJsonUrlItem {
  /** 项目标题 */
  title: string
  /** swagger json url */
  url: string
  /** 在浏览器打开外部链接 */
  link?: string
  /** basePath */
  basePath?: string
  /** `.d.ts` 文件保存路径 (独立) */
  savePath?: string
}

/** vscode 配置项 */
export interface CodeConfig {
  /** swagger 项目配置 */
  swaggerJsonUrl: SwaggerJsonUrlItem[]
  /** `.d.ts` 文件保存路径 (公共) */
  savePath: string
  /** 是否显示状态栏按钮 */
  showStatusbarItem: boolean
  /** 是否在更新接口时比对更改 (无更改不更新) */
  compareChanges: boolean
  /** 用户设置更新时重新加载数据 */
  reloadWhenSettingsChanged: boolean
}

export interface ExtConfig extends CodeConfig, LocalConfig {}

export interface LocalConfig {}

class Config {
  constructor() {
    this.initContext()
  }

  /**
   * 获取全部配置
   */
  get extConfig(): ExtConfig {
    return { ...this.getCodeConfig(), ...this.getLocalConfig() }
  }

  initContext() {
    for (const key in this.extConfig) {
      const val = this.extConfig[key]
      vscode.commands.executeCommand('setContext', `config.${CONFIG_GROUP}.${key}`, val)
    }
  }

  /**
   * 获取 vscode 配置
   */
  getCodeConfig(): CodeConfig {
    const resConfig = {}
    CONFIG_LIST.forEach((configKey) => {
      const settingsKey = `${CONFIG_GROUP}.${configKey}`
      resConfig[configKey] = workspace.getConfiguration().get(settingsKey)
    })
    return resConfig as CodeConfig
  }

  /**
   * 写入 vscode 配置
   * @param config
   */
  setCodeConfig(config: Partial<CodeConfig>) {
    for (const configKey in config) {
      const settingsKey = `${CONFIG_GROUP}.${configKey}`
      const val = config[configKey]
      workspace.getConfiguration().update(settingsKey, val, false)
    }
  }

  getChannelPath() {
    if (vscode.env.appName.indexOf('Insiders') > 0) {
      return 'Code - Insiders'
    } else {
      return 'Code'
    }
  }

  /**
   * 获取全局配置文件路径
   * @param fileName 文件名
   */
  getGlobalStoragePath(fileName = ''): string {
    const appPath =
      process.env.APPDATA ||
      (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local')
    const channelPath = this.getChannelPath()

    const storagePath = path.join(channelPath, 'User', 'globalStorage', `${PUBLISHER}.${EXT_NAME}`)
    const globalStoragePath = path.join(appPath, storagePath, fileName)

    // 如果不存在，则预创建
    if (!fs.existsSync(globalStoragePath)) {
      try {
        log.info(localize.getLocalize('text.success.create', 'GlobalStorage'))
        mkdirRecursive(storagePath, appPath)
      } catch (error) {
        log.error(localize.getLocalize('text.error.create.folders', globalStoragePath), true)
      }
    }

    return globalStoragePath
  }

  /**
   * 获取本地文件配置
   */
  getLocalConfig(): LocalConfig {
    let config = {}
    if (fs.existsSync(LOCAL_CONFIG_PATH)) {
      const configStr = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8')
      try {
        config = JSON.parse(configStr)
      } catch (error) {
        log.error(error)
      }
    } else {
      fs.writeFileSync(LOCAL_CONFIG_PATH, '{}')
      config = {}
    }
    return config
  }

  /**
   * 写入本地文件配置
   * @param config
   */
  setLocalConfig(config: LocalConfig) {
    const defaultConfig = this.getLocalConfig()
    try {
      const configStr = JSON.stringify(Object.assign({}, defaultConfig, config))
      return fs.writeFileSync(LOCAL_CONFIG_PATH, configStr, 'utf-8')
    } catch (error) {
      log.error(error)
    }
  }
}

export const config = new Config()
