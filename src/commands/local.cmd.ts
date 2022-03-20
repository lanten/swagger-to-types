import vscode from 'vscode'
import path from 'path'

import { log, localize } from '../tools'

import { ViewLocal, LocalItem } from '../views/local.view'
import { ViewList } from '../views/list.view'

export function registerLocalCommands(viewList: ViewList, viewLocal: ViewLocal) {
  const commands = {
    /** 刷新本地接口列表 */
    refresh: () => viewLocal.refresh(),

    /** 更新本地接口 */
    async updateInterface(
      item: LocalItem & FileHeaderInfo & { path: string; options?: any; savePath?: string; title?: string }
    ) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: localize.getLocalize('text.updateButton'),
          cancellable: false,
        },
        (progress) => {
          progress.report({ increment: -1 })
          return viewList._refresh()
        }
      )

      let fileInfo = item
      let isMenuAction = false

      if (!item.fileName) {
        isMenuAction = true
        if (item.options) {
          fileInfo = item.options
        }

        // 标题栏按钮
        if (item.path) {
          // @ts-ignore
          fileInfo = viewLocal.readLocalFile(item.path)
        }
      }

      if (!fileInfo || !fileInfo.fileName) {
        return log.error('<updateInterface> fileInfo error.', isMenuAction)
      }

      const fileName = path.basename(fileInfo.fileName, '.d.ts')

      const swaggerItem = viewList.getInterFacePathNameMap(fileName, fileInfo.savePath) as unknown as TreeInterface

      if (!swaggerItem) {
        return log.error('<updateInterface> swaggerItem is undefined.', isMenuAction)
      }

      viewList
        .saveInterface(swaggerItem, item.path)
        .then((res) => {
          if (res === 'no-change') {
            return log.info(
              `${localize.getLocalize('text.noChange')} <${fileInfo.name || fileInfo.title}>`,
              isMenuAction
            )
          }

          viewLocal.updateSingle(item.path)

          log.info(
            `${localize.getLocalize('command.local.updateInterface')} <${
              fileInfo.name || fileInfo.title
            }> ${localize.getLocalize('success')}`,
            isMenuAction
          )
        })
        .catch((err) => {
          log.error(
            `${localize.getLocalize('command.local.updateInterface')} <${
              fileInfo.name || fileInfo.title
            }> ${localize.getLocalize('failed')} ${err}`,
            isMenuAction
          )
        })
    },

    /** 更新所有本地接口 */
    updateAll() {
      if (viewLocal.localFilesMap.size <= 0)
        return log.info(
          `${localize.getLocalize('text.updateButton')}: ${localize.getLocalize('viewsWelcome.emptyLocal')}`,
          true
        )

      const confirmText = localize.getLocalize('text.confirm')
      const cancelText = localize.getLocalize('text.cancel')

      vscode.window
        .showWarningMessage(
          `${localize.getLocalize('text.updateButton')}: ${localize.getLocalize('text.confirmUpdateAll')}`,
          confirmText,
          cancelText
        )
        .then((res) => {
          if (res === confirmText) {
            viewLocal.updateAll()
          }
        })
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.local.${command}`, commands[command])
  }
}
