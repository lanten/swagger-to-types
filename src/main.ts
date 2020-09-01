import vscode from 'vscode'

export function activate(ctx: vscode.ExtensionContext) {
  global.ctx = ctx

  console.log('okk')
}

export function deactivate() {
  // this method is called when your extension is deactivated
}
