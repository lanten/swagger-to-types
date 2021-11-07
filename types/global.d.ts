import vscode from 'vscode'

declare global {
  // eslint-disable-next-line no-var
  var ctx: vscode.ExtensionContext

  interface AnyObj {
    [key: string]: any
  }

  type ItemTypes = 'files' | 'folders'
}
