import vscode from 'vscode'

declare global {
  namespace NodeJS {
    interface Global {
      ctx: vscode.ExtensionContext
    }
  }
}
