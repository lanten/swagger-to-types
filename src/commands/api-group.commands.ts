import vscode from 'vscode'
import path from 'path'

import { ApiGroup } from '@/views/api-group'
import { ApiList } from '@/views/api-list'
export function registerApiGroupCommands(apiGroup: ApiGroup, apiList: ApiList) {
  const commands = {
    // 刷新 Swagger Json 列表
    refresh: () => apiGroup.refresh(),

    // 选择
    onSelect(e: any) {
      $ext.config.setLocalConfig({ activeGroupIndex: e.index })
      apiList.treeList = []
      apiList.refresh()
    },

    // 添加项目
    async add() {
      const titleText = $ext.localize.getLocalize('text.swaggerJsonTitle')
      const urlText = $ext.localize.getLocalize('text.swaggerJsonUrl')
      const orText = $ext.localize.getLocalize('text.or')
      const title = await vscode.window.showInputBox({
        placeHolder: $ext.localize.getLocalize('temp.input.placeholder', titleText),
      })

      const url = await vscode.window.showInputBox({
        placeHolder: $ext.localize.getLocalize('temp.input.placeholder', urlText),
      })

      if (title && url) {
        const swaggerJsonUrl = Object.assign([], $ext.config.extConfig.swaggerJsonUrl || [])
        swaggerJsonUrl.push({ title, url })
        $ext.config.setWorkspaceConfig({ swaggerJsonUrl })
        apiGroup.refresh()
      } else {
        vscode.window.showErrorMessage(
          $ext.localize.getLocalize('temp.input.none', [titleText, urlText].join(` ${orText} `))
        )
      }
    },

    // 设置
    setting() {
      if ($ext.WORKSPACE_PATH) {
        const { swaggerJsonUrl, savePath } = $ext.config.extConfig
        if (!swaggerJsonUrl || !swaggerJsonUrl.length) {
          $ext.config.setWorkspaceConfig({ swaggerJsonUrl: [] })
        }

        if (!savePath) {
          $ext.config.setWorkspaceConfig({ savePath: '' })
        }

        $ext.log.info('open-workspace-settings')

        vscode.workspace.openTextDocument(path.join($ext.WORKSPACE_PATH, '.vscode/settings.json')).then(doc => {
          vscode.window.showTextDocument(doc)
        })
      } else {
        vscode.window.showWarningMessage($ext.localize.getLocalize('text.noWorkspace'))
      }
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`api.group.${command}`, commands[command])
  }
}
