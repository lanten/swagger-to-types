import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH } from './const'
// import config from './config'

/**
 * 递归创建路径
 * @param dir
 * @param inputPath
 * @param split
 */
export function mkdirRecursive(dir: string, inputPath = WORKSPACE_PATH || '', split = '/') {
  const dirArr = dir.split(split)
  const dir2 = dirArr.reduce((dirPath, folder) => {
    const p1 = path.join(inputPath, dirPath)
    if (!fs.existsSync(p1)) fs.mkdirSync(p1)
    return dirPath + '/' + folder
  })
  const p2 = path.join(inputPath, dir2)
  if (!fs.existsSync(p2)) fs.mkdirSync(p2)
}

/**
 * 打开一个未保存的文档
 * @param docStr
 * @param name
 */
export function preSaveDocument(docStr: string, filePath: string): Thenable<boolean> {
  const newFile = vscode.Uri.parse((fs.existsSync(filePath) ? 'file' : 'untitled') + ':' + filePath)

  return vscode.workspace.openTextDocument(newFile).then(document => {
    const edit = new vscode.WorkspaceEdit()
    const pMin = new vscode.Position(0, 0)
    // const pMax = new vscode.Position(100000000, 100000000)
    const pMax = new vscode.Position(Infinity, Infinity)

    // edit.insert(newFile, pMin, 'Hello world!' + JSON.stringify(e))
    edit.replace(newFile, new vscode.Range(pMin, pMax), docStr)
    return vscode.workspace.applyEdit(edit).then(success => {
      if (success) {
        vscode.window.showTextDocument(document)
      } else {
        vscode.window.showInformationMessage('Error!'['document error'])
      }
      return success
    })
  })
}
