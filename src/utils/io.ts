import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH, log } from './'

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
 * 动态导入一个 JS 文件
 * @param modulePath 要导入的文件路径
 */
export function requireModule(modulePath: string) {
  try {
    const m = require(modulePath)
    setTimeout(() => {
      delete require.cache[require.resolve(modulePath)]
    }, 200)
    return m
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * 打开一个未保存的文档
 * @param docStr
 * @param name
 */
export function preSaveDocument(docStr: string, filePath: string): Thenable<boolean> {
  const newFile = vscode.Uri.parse((fs.existsSync(filePath) ? 'file' : 'untitled') + ':' + filePath)

  return vscode.workspace.openTextDocument(newFile).then((document) => {
    const edit = new vscode.WorkspaceEdit()
    const pMin = new vscode.Position(0, 0)
    const pMax = new vscode.Position(Infinity, Infinity)
    edit.replace(newFile, new vscode.Range(pMin, pMax), docStr)
    return vscode.workspace.applyEdit(edit).then((success) => {
      if (success) {
        vscode.window.showTextDocument(document)
      } else {
        log.error('Error!'['document error'])
      }
      return success
    })
  })
}
