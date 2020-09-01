import vscode from 'vscode'
import path from 'path'

import { config, localize, WORKSPACE_PATH, log } from '../tools'
import { ApiGroup } from '../views/api-group'
import { ApiList } from '../views/api-list'
export function registerApiGroupCommands(apiGroup: ApiGroup, apiList: ApiList) {
  const commands = {
    // 刷新 Swagger Json 列表
    refresh: () => apiGroup.refresh(),

    // 选择
    onSelect(e: any) {
      config.setLocalConfig({ activeGroupIndex: e.index })
      apiList.treeList = []
      apiList.refresh()
    },

    // 添加项目
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
          apiGroup.refresh()
        }, 200)
      } else {
        vscode.window.showErrorMessage(
          localize.getLocalize('temp.input.none', [titleText, urlText].join(` ${orText} `))
        )
      }
    },

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
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`api.group.${command}`, commands[command])
  }
}
