import vscode from 'vscode'

declare global {
  namespace NodeJS {
    interface Global {
      ctx: vscode.ExtensionContext
    }
  }

  interface AnyObj {
    [key: string]: any
  }

  type ItemTypes = 'files' | 'folders'
}
