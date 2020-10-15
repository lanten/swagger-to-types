import vscode from 'vscode'
import { ViewList } from './views/list.view'
import { ViewLocal } from './views/local.view'

import { log } from './tools'
import { registerCommonCommands, registerListCommands, registerLocalCommands } from './commands'

const apiList = new ViewList()
const apiLocal = new ViewLocal()

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx

  const apiListTreeView = vscode.window.createTreeView('view.list', { treeDataProvider: apiList })
  // const apiLocalTreeView = vscode.window.createTreeView('view.local', { treeDataProvider: apiLocal })
  vscode.window.createTreeView('view.local', { treeDataProvider: apiLocal })

  registerCommonCommands()
  registerListCommands(apiList, apiListTreeView)
  registerLocalCommands(apiLocal)

  // 监听 settings.json 文件变更
  vscode.workspace.onDidChangeConfiguration(() => {
    apiList.onConfigurationRefresh()
    apiLocal.onConfigurationRefresh()
  })

  log.info('Extension activated.')
}

// this method is called when your extension is deactivated
export function deactivate() {
  apiLocal.destroy()

  log.info('Extension deactivated.')
}
