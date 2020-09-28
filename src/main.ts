import vscode from 'vscode'
import { ApiList } from './views/list.view'
import { ApiLocal } from './views/local.view'

import { WORKSPACE_PATH, localize, log } from './tools'
import { registerCommonCommands, registerListCommands, registerLocalCommands } from './commands'

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx
  if (!WORKSPACE_PATH) {
    vscode.window.showWarningMessage(localize.getLocalize('text.noWorkspace'))
  }
  const apiList = new ApiList()
  // const apiList = new ApiList()
  const apiLocal = new ApiLocal()
  const apiListTreeView = vscode.window.createTreeView('view.list', { treeDataProvider: apiList })

  registerCommonCommands()
  registerListCommands(apiList, apiListTreeView)
  registerLocalCommands(apiLocal)
  // vscode.window.registerTreeDataProvider('view.list', apiList)
  // vscode.window.registerTreeDataProvider('view.local', apiGroup)

  // DEBUG
  setTimeout(() => {
    log.outputChannel.show()
  }, 500)
}

export function deactivate() {
  // this method is called when your extension is deactivated
}
