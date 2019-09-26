import * as vscode from 'vscode'
// import { ApiList } from './views/api-list'
import { TestView } from './views/testView'

import { DepNodeProvider, Dependency } from './views/demo'

export function activate(ctx: vscode.ExtensionContext) {
  console.log('插件初始化!')

  new TestView(ctx)

  // const apiList = new ApiList()
  // vscode.window.registerTreeDataProvider('api.list', apiList)
  // vscode.commands.registerCommand('extension.helloWorld', () => apiList.refresh())

  // -----------------------------------------------------------------------------------

  const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath || '')
  vscode.window.registerTreeDataProvider('api.group', nodeDependenciesProvider)
  // vscode.commands.registerCommand('nodeDependencies.refreshEntry', () =>
  //   nodeDependenciesProvider.refresh()
  // )
  // vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName =>
  //   vscode.commands.executeCommand(
  //     'vscode.open',
  //     vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)
  //   )
  // )
  // vscode.commands.registerCommand('nodeDependencies.addEntry', () =>
  //   vscode.window.showInformationMessage(`Successfully called add entry.`)
  // )
  // vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) =>
  //   vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`)
  // )
  // vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) =>
  //   vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`)
  // )

  // -----------------------------------------------------------------------------------

  // require('./views/api-list').default(ctx)

  // let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
  //   vscode.window.showInformationMessage('Hello World!')
  // })

  // const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
  // vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
  // ctx.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}
