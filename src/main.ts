import vscode from 'vscode'
import { ApiList } from './views/list.view'
import { ApiLocal } from './views/local.view'

import { log } from './tools'
import { registerCommonCommands, registerListCommands, registerLocalCommands } from './commands'

const apiList = new ApiList()
const apiLocal = new ApiLocal()

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx

  const apiListTreeView = vscode.window.createTreeView('view.list', { treeDataProvider: apiList })
  // const apiLocalTreeView = vscode.window.createTreeView('view.local', { treeDataProvider: apiLocal })
  vscode.window.createTreeView('view.local', { treeDataProvider: apiLocal })

  registerCommonCommands()
  registerListCommands(apiList, apiListTreeView)
  registerLocalCommands(apiLocal)

  log.info('Extension activated.')
}

// this method is called when your extension is deactivated
export function deactivate() {
  apiLocal.destroy()

  log.info('Extension deactivated.')
}
