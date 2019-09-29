import vscode from 'vscode'
import { ApiList } from './views/api-list'

// import { DepNodeProvider, Dependency } from './views/demo'

export function activate(ctx: vscode.ExtensionContext) {
  // Global Context
  global.ctx = ctx

  console.log('插件初始化!', { ctx })

  const apiList = new ApiList()
  vscode.window.registerTreeDataProvider('api.list', apiList)
  vscode.commands.registerCommand('extension.helloWorld', () => apiList.refresh())
}

export function deactivate() {
  // this method is called when your extension is deactivated
}
