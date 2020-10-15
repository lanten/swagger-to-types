import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { BaseTreeProvider, BaseTreeItem, BaseTreeItemOptions } from '../core'
import { config, log, WORKSPACE_PATH } from '../tools'

export class ViewLocal extends BaseTreeProvider<ViewLocalItem> {
  public localFilesList: FileHeaderInfo[] = []
  public localFilesMap = new Map<string, FileHeaderInfo>()

  private localPath = path.resolve(WORKSPACE_PATH || '', config.extConfig.savePath)

  constructor() {
    super()

    this.initLocalFiles()

    /** 监听文件保存 */
    vscode.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
      // 过滤非 TS 语言文件
      if (languageId !== 'typescript') return
      // 过滤非接口目录文件
      if (!fileName.includes(this.localPath)) return

      const fileInfo = this.readLocalFile(fileName)

      if (fileInfo) {
        this.localFilesMap.set(fileInfo.fileName, fileInfo)
        this.refactorLocalFilesList()
      }
    })
  }

  /** 初始化本地文件 */
  initLocalFiles() {
    this.localFilesMap.clear()

    if (fs.existsSync(this.localPath)) {
      fs.readdirSync(this.localPath).forEach((file) => {
        const filePath = path.join(this.localPath, file)
        const fileInfo = this.readLocalFile(filePath)

        if (fileInfo) {
          this.localFilesMap.set(fileInfo.fileName, fileInfo)
        }
      })

      this.refactorLocalFilesList()
    } else {
      fs.mkdirSync(this.localPath)
    }
  }

  /** 读取本地文件 */
  readLocalFile(fileName: string): FileHeaderInfo | undefined {
    try {
      const fileStr = fs.readFileSync(fileName, 'utf-8')
      const headerStr = fileStr.replace(/^[\s]*\/\*\*(.*?)\*\/(.+)$/s, '$1')

      const headerInfo: FileHeaderInfo = {
        fileName: fileName.replace(/^.+\/(.+?)(\.d)?\.ts$/, '$1'),
        filePath: fileName,
      }

      headerStr.replace(/\*\s*@([^\s]+)[^\S\n]*([^\n]*?)\n/g, (_, key, value) => {
        headerInfo[key] = value || true
        return ''
      })

      return headerInfo
    } catch (error) {
      log.error(`Read File Error - ${fileName}`)
    }
  }

  getChildren(): Thenable<ViewLocalItem[]> {
    const treeItems = this.renderItem(this.localFilesList)

    return Promise.resolve(treeItems)
  }

  renderItem(itemList: FileHeaderInfo[]): ViewLocalItem[] {
    return itemList.map((item) => {
      const title = item.name || item.fileName

      const options: BaseTreeItemOptions = {
        title,
        type: item.ignore ? 'file-ignore' : 'file-sync',
        subTitle: `[${item.update || 'No Update Date'}] ${item.path}`,
        collapsible: 0,
        command: {
          title,
          command: 'cmd.common.openLocalFile',
          arguments: [item],
        },
      }

      return new ViewLocalItem(options)
    })
  }

  /** 重新生成本地文件列表 */
  public refactorLocalFilesList() {
    this.localFilesList = []
    this.localFilesMap.forEach((val) => {
      this.localFilesList.push(val)
    })
    this._onDidChangeTreeData.fire(undefined)
  }

  /** 完全刷新本地文件列表 */
  public refresh(): void {
    this.initLocalFiles()
    log.info('refresh: view.local')
  }

  /** settings.json 文件变更时触发 */
  public onConfigurationRefresh() {
    const { savePath } = config.extConfig
    this.localPath = path.resolve(WORKSPACE_PATH || '', savePath)
  }

  /** 销毁时释放资源 */
  destroy(): void {}
}

export class ViewLocalItem extends BaseTreeItem {}
