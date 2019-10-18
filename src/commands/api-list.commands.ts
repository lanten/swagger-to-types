import vscode from 'vscode'
import path from 'path'
import fs from 'fs'

import { ApiList } from '@/views/api-list'
import { parseToInterface } from '@/core/data-parse'

export function registerApiListCommands(apiList: ApiList) {
  // 刷新 API 列表
  vscode.commands.registerCommand('api.list.refresh', () => apiList.refresh())

  // 选择接口
  vscode.commands.registerCommand('api.list.onSelect', (e: TreeInterface) => {
    const { savePath = '' } = $ext.config.extConfig
    const filePath = path.join($ext.WORKSPACE_PATH || '', savePath, `${e.operationId}.d.ts`)
    $ext.preSaveDocument(parseToInterface(e), filePath)
  })
}
