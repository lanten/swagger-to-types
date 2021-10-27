import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH, EXT_NAME, config, localize, preSaveDocument, log } from '../tools'
import { openListPicker, parseToInterface } from '../core'

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
      const { savePath = '' } = config.extConfig

      const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
      preSaveDocument(parseToInterface(e), filePath)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.title')
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
        log.info(`<cmd.list.add> Add Swagger Project: [${title}]`)
        setTimeout(() => {
          viewList.refresh()
        }, 200)
      } else {
        vscode.window.showErrorMessage(
          localize.getLocalize('temp.input.none', [titleText, urlText].join(` ${orText} `))
        )
        return
      }
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

        const listItem = viewList.transformToListItem(res.source, res.configItem)

        listTreeView.reveal(listItem, { expand: true, select: true }).then(() => {
          setTimeout(() => {
            commands.onSelect((res.source as unknown) as TreeInterface)
          }, 100)
        })

        const filePath = path.join(viewList.localPath, `${res.source.pathName}.d.ts`)
        if (fs.existsSync(filePath)) {
          const fileInfo = viewLocal.readLocalFile(filePath)
          if (fileInfo) {
            localTreeView.reveal(viewLocal.renderItem(fileInfo), { expand: true, select: true })
          }
        }
        // const localItem = viewLocal.readLocalFile(res)
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
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
