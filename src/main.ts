import vscode from 'vscode'
import { ApiList } from './views/api-list'
import { ApiGroup } from './views/api-group'

export function activate(ctx: vscode.ExtensionContext) {
  // Global Context
  global.ctx = ctx

  vscode.window.registerTreeDataProvider('api.group', new ApiGroup())
  vscode.window.registerTreeDataProvider('api.list', new ApiList())
}

// export function deactivate() {
//   // this method is called when your extension is deactivated
// }
