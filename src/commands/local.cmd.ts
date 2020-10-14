import vscode from 'vscode'

import { ViewLocal } from '../views/local.view'

export function registerLocalCommands(apiGroup: ViewLocal) {
  const commands = {
    /** 刷新本地接口列表 */
    refresh: () => apiGroup.refresh(),

    /** 本地接口列表选中 */
    onSelect(e: any) {
      console.log(e)
      // config.setLocalConfig({ activeGroupIndex: e.index })
      // apiList.treeList = []
      // apiList.refresh()
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.local.${command}`, commands[command])
  }
}
