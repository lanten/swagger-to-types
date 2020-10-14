import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'

import { BaseTreeProvider, BaseTreeItem, BaseTreeItemOptions } from '../core'
import { config, SwaggerJsonUrlItem, log, WORKSPACE_PATH } from '../tools'

export class ViewLocal extends BaseTreeProvider<ViewLocalItem> {
  public treeList: SwaggerJsonUrlItem[] = []
  private localFileWatcher?: chokidar.FSWatcher

  constructor() {
    super()
    this.watchLocalFile()
  }

  /** 监听本地文件变更 */
  watchLocalFile() {
    if (!WORKSPACE_PATH) return

    const { savePath } = config.extConfig

    const absPath = path.resolve(WORKSPACE_PATH, savePath)
    console.log(absPath)

    if (!fs.existsSync(absPath)) {
      fs.mkdirSync(absPath, { recursive: true })
    }

    this.localFileWatcher = chokidar.watch(path.join(absPath, '*.d.ts'))
    this.localFileWatcher
      .on('add', (path, state) => console.log(`File ${path} has been added`, state))
      .on('change', (path, state) => console.log(`File ${path} has been changed`, state))
      .on('unlink', (path) => console.log(`File ${path} has been removed`))
  }

  getSwaggerSettings(): SwaggerJsonUrlItem[] {
    return config.extConfig.swaggerJsonUrl || []
  }

  getChildren(): Thenable<ViewLocalItem[]> {
    const treeItems = this.renderItem(this.getSwaggerSettings())

    return Promise.resolve(treeItems)
  }

  renderItem(itemList: SwaggerJsonUrlItem[]): ViewLocalItem[] {
    return itemList.map((item) => {
      const title = item.title || item.url
      const options: BaseTreeItemOptions = {
        title,
        type: 'group',
        subTitle: item.title ? item.url : '',
        collapsible: 0,
        command: {
          title,
          command: 'api.group.onSelect',
        },
      }

      return new ViewLocalItem(options)
    })
  }

  refresh(): void {
    this.treeList = []
    this._onDidChangeTreeData.fire(undefined)
    log.info('refresh: view.local')
  }

  /** 销毁时释放资源 */
  destroy(): void {
    this.localFileWatcher?.close()
  }
}

export class ViewLocalItem extends BaseTreeItem {}
