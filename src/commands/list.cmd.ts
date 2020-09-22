import vscode from 'vscode'
import path from 'path'

import { WORKSPACE_PATH, config, localize, preSaveDocument } from '../tools'

import { ApiList } from '../views/list.view'
import { parseToInterface } from '../core/data-parse'

export function registerListCommands(apiList: ApiList) {
  const commands = {
    /** 刷新 API 列表 */
    refresh: () => apiList.refresh(),

    /** 选择接口 */
    onSelect: (e: TreeInterface) => {
      const { savePath = '' } = config.extConfig

      const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
      preSaveDocument(parseToInterface(e), filePath)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.swaggerJsonTitle')
      const urlText = localize.getLocalize('text.swaggerJsonUrl')
      const orText = localize.getLocalize('text.or')
      const title = await vscode.window.showInputBox({
        placeHolder: localize.getLocalize('temp.input.placeholder', titleText),
      })

      const url = await vscode.window.showInputBox({
        placeHolder: localize.getLocalize('temp.input.placeholder', urlText),
      })

      if (title && url) {
        const swaggerJsonUrl = Object.assign([], config.extConfig.swaggerJsonUrl || [])
        swaggerJsonUrl.push({ title, url })
        config.setCodeConfig({ swaggerJsonUrl })
        setTimeout(() => {
          apiList.refresh()
        }, 200)
      } else {
        vscode.window.showErrorMessage(
          localize.getLocalize('temp.input.none', [titleText, urlText].join(` ${orText} `))
        )
      }
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
