import vscode from 'vscode'
import path from 'path'

import { config, localize, WORKSPACE_PATH, log } from '../tools'

import { ListItem } from '../views/list.view'

export function registerCommonCommands() {
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
      const link = item.options.link || item.options.url
      console.log(link)
      // vscode.commands.executeCommand('vscode.open', link)
      vscode.env.openExternal(vscode.Uri.parse(link))
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.common.${command}`, commands[command])
  }
}
