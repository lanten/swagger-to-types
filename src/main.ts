import vscode from 'vscode'
import { ViewList } from './views/list.view'
import { ViewLocal } from './views/local.view'

import { log } from './tools'
import { registerCommonCommands, registerListCommands, registerLocalCommands } from './commands'

const viewList = new ViewList()
const viewLocal = new ViewLocal()

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx

  const listTreeView = vscode.window.createTreeView('view.list', { treeDataProvider: viewList })
  // const apiLocalTreeView = vscode.window.createTreeView('view.local', { treeDataProvider: apiLocal })
  vscode.window.createTreeView('view.local', { treeDataProvider: viewLocal })

  registerCommonCommands(viewList, viewLocal)
  registerListCommands(viewList, listTreeView, viewLocal)
  registerLocalCommands(viewLocal)

  // 监听 settings.json 文件变更
  vscode.workspace.onDidChangeConfiguration(() => {
    viewList.onConfigurationRefresh()
    viewLocal.onConfigurationRefresh()
  })

  log.info('Extension activated.')
}

// this method is called when your extension is deactivated
export function deactivate() {
  viewLocal.destroy()

  log.info('Extension deactivated.')
}
