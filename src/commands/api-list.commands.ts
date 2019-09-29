import vscode from 'vscode'
import path from 'path'

import { ApiList } from '@/views/api-list'
export function registerApiListCommands(apiList: ApiList) {
  // 刷新 API 列表
  vscode.commands.registerCommand('api.list.refresh', () => apiList.refresh())

  // 选择接口
  vscode.commands.registerCommand('api.list.onSelect', e => {
    console.log(e)
    const newFile = vscode.Uri.parse('untitled:' + path.join(vscode.workspace.rootPath || '', 'types.d.ts'))
    // const newFile = vscode.Uri.parse('untitled:' + 'types.d.ts')

    vscode.workspace.openTextDocument(newFile).then(document => {
      const edit = new vscode.WorkspaceEdit()
      edit.insert(newFile, new vscode.Position(0, 0), 'Hello world!' + JSON.stringify(e))
      return vscode.workspace.applyEdit(edit).then(success => {
        if (success) {
          vscode.window.showTextDocument(document)
        } else {
          vscode.window.showInformationMessage('Error!')
        }
      })
    })
  })
}
