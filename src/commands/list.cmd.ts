import vscode from 'vscode'
import path from 'path'

import { WORKSPACE_PATH, EXT_NAME, config, localize, preSaveDocument, log } from '../tools'
import { openListPicker } from '../core'

import { ApiList, ListItem } from '../views/list.view'
import { parseToInterface } from '../core/data-parse'

export function registerListCommands(apiList: ApiList, apiListTreeView: vscode.TreeView<ListItem>) {
  const commands = {
    /** 刷新 API 列表 */
    refresh: () => {
      apiList.refresh()
    },

    /** 选择接口 */
    onSelect: (e: TreeInterface) => {
      const { savePath = '' } = config.extConfig
      console.log(e)

      const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
      preSaveDocument(parseToInterface(e), filePath)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.swaggerJsonTitle')
      const urlText = localize.getLocalize('text.swaggerJsonUrl')
      const orText = localize.getLocalize('text.or')
      const title = await vscode.window.showInputBox({
        placeHolder: localize.getLocalize('temp.input.placeholder', titleText),
      })

      if (!title) {
        return
      }

      const url = await vscode.window.showInputBox({
        placeHolder: localize.getLocalize('temp.input.placeholder', urlText),
      })

      if (title && url) {
        const swaggerJsonUrl = Object.assign([], config.extConfig.swaggerJsonUrl || [])
        swaggerJsonUrl.push({ title, url })
        config.setCodeConfig({ swaggerJsonUrl })
        log.info(`<add> Add Swagger Project: [${title}]`)
        setTimeout(() => {
          apiList.refresh()
        }, 200)
      } else {
        vscode.window.showErrorMessage(
          localize.getLocalize('temp.input.none', [titleText, urlText].join(` ${orText} `))
        )
        return
      }
    },

    /** 移除项目 */
    remove() {
      vscode.window.showInformationMessage('开发中...')
    },

    search() {
      openListPicker({
        title: `${EXT_NAME} - ${localize.getLocalize('command.search')} (UPDATE:${apiList.updateDate})`,
        placeholder: localize.getLocalize('text.search.placeholder'),
        before: () => apiList.getSearchList(),
      }).then((res) => {
        console.log(res)
        if (!res.source) return log.error('Picker.res.source in undefined', true)
        if (!res.apiUrl) return log.error('Picker.res.apiUrl in undefined', true)
        apiListTreeView
          .reveal(apiList.transformToListItem(res.source, res.apiUrl), {
            expand: true,
            select: true,
          })
          .then(() => {
            commands.onSelect((res.source as unknown) as TreeInterface)
          })
      })
    },

    /** 保存接口至本地 (单个/批量) */
    saveInterface(item: ListItem) {
      vscode.window.showInformationMessage('开发中...')
      console.log(item)
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
