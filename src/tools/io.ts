import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH, log, config } from '.'

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
  } catch (error: any) {
    throw new Error(error)
  }
}

class SwaggerInterfaceProvider implements vscode.TextDocumentContentProvider {
  static scheme = 'swagger-interface-provider'
  public doc = ''

  provideTextDocumentContent(): string {
    return this.doc
  }
}

const swaggerInterfaceProvider = new SwaggerInterfaceProvider()

vscode.workspace.registerTextDocumentContentProvider(SwaggerInterfaceProvider.scheme, swaggerInterfaceProvider)

/**
 * 打开一个未保存的文档
 * @param docStr
 * @param name
 */
export async function preSaveDocument(docStr: string, filePath: string) {
  const newFile = vscode.Uri.parse(
    (fs.existsSync(filePath) ? 'file' : SwaggerInterfaceProvider.scheme) + ':' + filePath
  )

  // TODO file 下文档不刷新

  // swaggerInterfaceProvider.doc = docStr
  const doc = await vscode.workspace.openTextDocument(newFile)

  const edit = new vscode.WorkspaceEdit()
  const pMin = new vscode.Position(0, 0)
  const pMax = new vscode.Position(999999999, 999999999)
  edit.replace(newFile, new vscode.Range(pMin, pMax), docStr)

  return vscode.workspace.applyEdit(edit).then((success) => {
    if (success) {
      vscode.window.showTextDocument(doc)
    } else {
      log.error('open document error error!', true)
    }
    return success
  })

  // await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Active })
}

/**
 * 保存文件
 * @param docStr
 * @param filePath
 */
export async function saveDocument(docStr: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const localPath = path.resolve(WORKSPACE_PATH || '', config.extConfig.savePath)
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true })
    }

    try {
      fs.writeFileSync(filePath, docStr, 'utf-8')
      resolve(void 0)
    } catch (error: any) {
      log.error(error, true)
      reject()
    }
  })
}
