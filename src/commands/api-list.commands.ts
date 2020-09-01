import vscode from 'vscode'
import path from 'path'

import { WORKSPACE_PATH, config, preSaveDocument } from '../tools'

import { ApiList } from '../views/api-list'
import { parseToInterface } from '../core/data-parse'

export function registerApiListCommands(apiList: ApiList) {
  // 刷新 API 列表
  vscode.commands.registerCommand('api.list.refresh', () => apiList.refresh())

  // 选择接口
  vscode.commands.registerCommand('api.list.onSelect', (e: TreeInterface) => {
    const { savePath = '' } = config.extConfig

    const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
    preSaveDocument(parseToInterface(e), filePath)
  })
}
