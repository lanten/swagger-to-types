import vscode from 'vscode'
import { ApiList } from './views/api-list'
import { ApiGroup } from './views/api-group'

import { WORKSPACE_PATH, localize } from './tools'
import { registerApiListCommands, registerApiGroupCommands } from './commands'

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx
  if (!WORKSPACE_PATH) {
    vscode.window.showWarningMessage(localize.getLocalize('text.noWorkspace'))
  }
  const apiList = new ApiList()
  const apiGroup = new ApiGroup()
  registerApiListCommands(apiList)
  registerApiGroupCommands(apiGroup, apiList)
  vscode.window.registerTreeDataProvider('api.list', apiList)
  vscode.window.registerTreeDataProvider('api.local', apiGroup)
}

export function deactivate() {
  // this method is called when your extension is deactivated
}
