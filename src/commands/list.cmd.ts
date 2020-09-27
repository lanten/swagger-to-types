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

    search() {
      openListPicker({
        title: `${EXT_NAME} + ${localize.getLocalize('command.search')}`,
        placeholder: localize.getLocalize('command.search.placeholder'),
        before: () => apiList.getSearchList(),
        items: [
          { label: '1asdasd', description: '11111', detail: '1111asdasdasdasdasdasdasdasdasdasdasdasdasdasdsa' },
          { label: '2', description: '2222' },
          { label: '3', description: '3333' },
        ],
      }).then((res) => {
        console.log(res)
      })
    },

    /** 保存接口至本地 (单个/批量) */
    saveInterface(item: ListItem) {
      console.log(item)
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
