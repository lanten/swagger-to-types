import { workspace } from 'vscode'
import fs from 'fs'

import { LOCAL_CONFIG_PATH } from './const'
import log from './log'
import localize from './localize'

const CONFIG_GROUP = 'swaggerToTypes'
const CONFIG_LIST = ['swaggerJsonUrl', 'savePath']

class Config {
  /**
   * 获取全部配置
   */
  get extConfig(): ExtConfig {
    return { ...this.getWorkspaceConfig(), ...this.getLocalConfig() }
  }

  /**
   * 获取工作区配置
   */
  getWorkspaceConfig(): WorkspaceConfig {
    const resConfig = {}
    CONFIG_LIST.forEach(configKey => {
      const settingsKey = `${CONFIG_GROUP}.${configKey}`
      resConfig[configKey] = workspace.getConfiguration().get(settingsKey)
    })
    return resConfig
  }

  setWorkspaceConfig(config: WorkspaceConfig) {
    for (const configKey in config) {
      const settingsKey = `${CONFIG_GROUP}.${configKey}`
      const val = config[configKey]
      workspace.getConfiguration().update(settingsKey, val, false)
    }
  }

  /**
   * 获取本地配置
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

const config = new Config()

export default config
