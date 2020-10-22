import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { config, localize, WORKSPACE_PATH, log } from '../tools'

import { ListItem, ViewList } from '../views/list.view'
import { LocalItem, ViewLocal } from '../views/local.view'

export function registerCommonCommands(viewList: ViewList, viewLocal: ViewLocal) {
  const commands = {
    // 设置
    setting() {
      if (WORKSPACE_PATH) {
        const { swaggerJsonUrl, savePath } = config.extConfig
        if (!swaggerJsonUrl || !swaggerJsonUrl.length) {
          config.setCodeConfig({ swaggerJsonUrl: [] })
        }

        if (!savePath) {
          config.setCodeConfig({ savePath: '' })
        }

        log.info('open-workspace-settings')

        vscode.workspace.openTextDocument(path.join(WORKSPACE_PATH, '.vscode/settings.json')).then((doc) => {
          vscode.window.showTextDocument(doc)
        })
      } else {
        vscode.window.showWarningMessage(localize.getLocalize('text.noWorkspace'))
      }
    },

    /** 打开外部链接 */
    openLink(item: ListItem) {
      const { configItem } = item.options
      const link = configItem.link || configItem.url

      vscode.env.openExternal(vscode.Uri.parse(link))
    },

    /** 打开本地文件 */
    openFile(path?: string) {
      if (!path) return log.error(localize.getLocalize('error.path'), true)

      vscode.workspace.openTextDocument(path).then((doc) => {
        vscode.window.showTextDocument(doc)
      })
    },

    /** 删除本地文件 */
    deleteFile(path: string | LocalItem) {
      const pathH = typeof path === 'string' ? path : path.options.filePath
      if (!pathH) return log.error(localize.getLocalize('error.path'), true)

      const confirmText = localize.getLocalize('text.confirm')
      const cancelText = localize.getLocalize('text.cancel')

      vscode.window
        .showWarningMessage(localize.getLocalize('text.confirmDeleteFile'), confirmText, cancelText)
        .then((res) => {
          if (res === confirmText) {
            try {
              fs.unlinkSync(pathH)
              log.info(`Remove file: ${pathH}`)
              viewLocal.refresh()
            } catch (error) {
              log.error(error, true)
            }
          }
        })
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.common.${command}`, commands[command])
  }
}
