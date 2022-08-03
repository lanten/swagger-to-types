import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import {
  WORKSPACE_PATH,
  EXT_NAME,
  config,
  localize,
  preSaveDocument,
  saveDocument,
  log,
  deleteEmptyProperty,
} from '../tools'
import { openListPicker, renderToInterface } from '../core'

import { ViewList, ListItem } from '../views/list.view'
import { ViewLocal, LocalItem } from '../views/local.view'

export function registerListCommands({
  viewList,
  viewLocal,
  listTreeView,
  localTreeView,
}: {
  viewList: ViewList
  viewLocal: ViewLocal
  listTreeView: vscode.TreeView<ListItem>
  localTreeView: vscode.TreeView<LocalItem>
}) {
  const commands = {
    /** 刷新 API 列表 */
    refresh: () => {
      viewList.refresh()
    },

    /** 选择接口 */
    onSelect: (e: TreeInterface) => {
      const savePath = e.savePath || config.extConfig.savePath || ''

      const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
      preSaveDocument(renderToInterface(e), filePath, true)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.title')
      const urlText = localize.getLocalize('text.swaggerJsonUrl')
      const savePathText = localize.getLocalize('text.config.savePath')

      const url = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', urlText),
        placeHolder: 'http://',
      })

      if (!url) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', urlText))
        return
      }

      config.extConfig.swaggerJsonUrl.forEach((v) => {
        if (v.url === url) {
          log.error(localize.getLocalize('text.exist', urlText), true)
          throw new Error()
        }
      })

      const title = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', titleText),
      })

      if (!title) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', titleText))
        return
      }

      const savePath = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', savePathText),
        placeHolder: `${config.extConfig.savePath} (${localize.getLocalize('text.canBeEmpty')})`,
      })

      const swaggerJsonUrl = Object.assign([], config.extConfig.swaggerJsonUrl || [])
      swaggerJsonUrl.push(deleteEmptyProperty({ title, url, savePath }))
      config.setCodeConfig({ swaggerJsonUrl })
      log.info(`<cmd.list.add> Add Swagger Project: [${title}]`)
      setTimeout(() => {
        viewList.refresh()
      }, 200)
    },

    /** 搜索接口列表 (远程) */
    search() {
      openListPicker({
        title: `${EXT_NAME} - ${localize.getLocalize('command.search')} (UPDATE:${viewList.updateDate})`,
        placeholder: localize.getLocalize('text.search.placeholder'),
        before: () => viewList.getSearchList(),
      }).then((res) => {
        if (!res.source) return log.error('Picker.res.source is undefined', true)
        if (!res.configItem) return log.error('Picker.res.configItem is undefined', true)

        let hasLocalFile = false
        for (let i = 0; i < viewLocal.allSavePath.length; i++) {
          const localPath = viewLocal.allSavePath[i]
          const filePath = path.join(localPath, `${res.source.pathName}.d.ts`)
          if (fs.existsSync(filePath)) {
            const fileInfo = viewLocal.readLocalFile(filePath)
            if (fileInfo) {
              hasLocalFile = true
              localTreeView.reveal(viewLocal.renderItem(fileInfo), { expand: true, select: true })
            }
          }
        }
        if (hasLocalFile) return // 已有本地文件

        const listItem = viewList.transformToListItem(res.source, res.configItem)
        listTreeView.reveal(listItem, { expand: true, select: true }).then(() => {
          setTimeout(() => {
            commands.onSelect(res.source as unknown as TreeInterface)
          }, 100)
        })
      })
    },

    /** 保存接口至本地 (单个/批量) */
    async saveInterface(item: ListItem) {
      switch (item.options.type) {
        case 'group':
          viewList
            .saveInterfaceGroup(item)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('success')}`,
                false
              )

              viewLocal.refresh()
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('failed')} ${err}`,
                true
              )
            })
          break

        case 'interface':
          let interfaceItem: TreeInterface | undefined
          try {
            // @ts-ignore
            interfaceItem = item.command?.arguments[0]
          } catch (error) {
            log.error(error, true)
          }

          if (!interfaceItem) {
            return log.error('interfaceItem is undefined.', true)
          }

          viewList
            .saveInterface(interfaceItem)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize('success')}`,
                true
              )
              viewLocal.refresh()
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize(
                  'failed'
                )} ${err}`,
                true
              )
            })
          break

        default:
          log.warn(localize.getLocalize('error.action'), true)
          log.warn(JSON.stringify(item))
          break
      }
    },

    /** 保存文档 */
    saveInterfaceWitchDoc(doc: vscode.TextDocument) {
      const docText = doc.getText()
      saveDocument(docText, doc.fileName).then(() => {
        viewLocal.refresh()
        preSaveDocument(docText, doc.fileName) // 更新显示状态
      })
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
