import path from 'path'
import fs from 'fs'
import vscode from 'vscode'

import { WORKSPACE_PATH, TEMPLATE_FILE_NAME, config, requireModule, localize } from '../tools'

export interface TemplateBaseType {}

export class TemplateBase {
  // templates: TemplateBaseType = {}

  // constructor() {
  //   this.templates = this.getTemplateConfig() || {}
  // }

  /** 获取模板配置 */
  getTemplateConfig(): TemplateBaseType | void {
    const allTemplateConfig = { ...this.getGlobalTemplateConfig(), ...this.getWorkspaceTemplateConfig() }

    console.log(allTemplateConfig)
  }

  /** 获取工作区模板配置 */
  getWorkspaceTemplateConfig(): TemplateBaseType | void {
    if (WORKSPACE_PATH) {
      const workspaceConfigPath = path.join(WORKSPACE_PATH, '.vscode', TEMPLATE_FILE_NAME)
      if (fs.existsSync(workspaceConfigPath)) {
        return requireModule(workspaceConfigPath)
      }
    }
  }

  /** 获取全局模板配置 */
  getGlobalTemplateConfig(): TemplateBaseType | void {
    const globalStoragePath = config.getGlobalStoragePath()
    const globalTemplatePath = path.join(globalStoragePath, TEMPLATE_FILE_NAME)
    if (fs.existsSync(globalTemplatePath)) {
      return requireModule(globalTemplatePath)
    }
  }
}
