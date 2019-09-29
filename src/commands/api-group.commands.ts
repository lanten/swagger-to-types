import vscode from 'vscode'
import path from 'path'

import { ApiGroup } from '@/views/api-group'
export function registerApiGroupCommands(apiGroup: ApiGroup) {
  const commands = {
    // 刷新 Swagger Json 列表
    refresh: () => apiGroup.refresh(),

    // 选择
    onSelect(e: any) {
      console.log('api.group.onSelect', e)
    },

    add() {
      console.log('add')
    },

    // 设置
    setting() {
      // const workspaceConfigPath =
      console.log($ext.WORKSPACE_PATH)
      console.log('setting')
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`api.group.${command}`, commands[command])
  }
}
