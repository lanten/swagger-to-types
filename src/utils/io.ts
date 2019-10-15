import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH } from './const'
import config from './config'

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
export function preSaveDocument(docStr: string, name: string): Thenable<boolean> {
  const { savePath = '' } = config.extConfig
  const savePathH = path.join(WORKSPACE_PATH || '', savePath, name)
  const newFile = vscode.Uri.parse('untitled:' + savePathH)
  // const newFile = vscode.Uri.parse('untitled:' + 'types.d.ts')

  return vscode.workspace.openTextDocument(newFile).then(document => {
    const edit = new vscode.WorkspaceEdit()
    const pMin = new vscode.Position(0, 0)
    const pMan = new vscode.Position(999999999, 999999999)
    // edit.insert(newFile, pMin, 'Hello world!' + JSON.stringify(e))
    edit.replace(newFile, new vscode.Range(pMin, pMan), docStr)
    return vscode.workspace.applyEdit(edit).then(success => {
      if (success) {
        vscode.window.showTextDocument(document)
      } else {
        vscode.window.showInformationMessage('Error!')
      }
      return success
    })
  })
}
