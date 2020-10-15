import vscode from 'vscode'

import { WORKSPACE_PATH } from '../tools'

export interface BaseTreeItemOptions {
  /** 标题 */
  title: string
  /** 副标题 */
  subTitle: string
  /** 可折叠状态 0:不可折叠 1:折叠 2:展开 */
  collapsible?: 0 | 1 | 2
  /** 类型 */
  type: SwaggerJsonTreeItem['type']
  /** 选中事件 */
  command?: vscode.Command
  contextValue?: string
}

export class BaseTreeItem<ExtOptions extends AnyObj = AnyObj> extends vscode.TreeItem {
  /** 标题 */
  public label: string

  public readonly ICON_MAP: { [K in SwaggerJsonTreeItem['type']]: vscode.TreeItem['iconPath'] } = {
    root: new vscode.ThemeIcon('package'),
    group: vscode.ThemeIcon.Folder,
    interface: new vscode.ThemeIcon('debug-disconnect'),
    file: new vscode.ThemeIcon('file'),
  }

  constructor(public readonly options: BaseTreeItemOptions & ExtOptions) {
    super(options.title, options.collapsible)
    this.label = options.title
    this.command = options.command
    this.tooltip = `${this.label} - ${options.subTitle}`
    this.description = options.subTitle
  }

  // // @ts-ignore
  // get command() {
  //   return this.options.command
  // }

  // // 鼠标悬停时的 label
  // // @ts-ignore
  // get tooltip(): string {
  //   return `${this.label} - ${this.options.subTitle}`
  // }

  // // 说明文本
  // // @ts-ignore
  // get description(): string {
  //   return this.options.subTitle
  // }

  iconPath = this.ICON_MAP[this.options.type]

  contextValue = this.options.contextValue
}

export class BaseTreeProvider<T> implements vscode.TreeDataProvider<T> {
  public _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<T | undefined>()
  public readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event
  public readonly workspaceRoot = WORKSPACE_PATH || ''

  getTreeItem(element: T): vscode.TreeItem {
    return element
  }

  getChildren(): Thenable<T[]> {
    return Promise.resolve([])
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }
}

/**
 * 打开一个列表选择框 (单选)
 * @param conf
 */
export function openListPicker(conf: ListPickerConfig): Promise<ListPickerItem> {
  return new Promise((resolve) => {
    const listPicker = vscode.window.createQuickPick()
    listPicker.placeholder = conf.placeholder
    listPicker.matchOnDescription = true
    listPicker.matchOnDetail = true
    listPicker.show()
    listPicker.title = conf.title

    if (conf.before) {
      listPicker.busy = true
      conf
        .before()
        .then((items) => {
          listPicker.items = items
        })
        .finally(() => {
          listPicker.busy = false
        })
    } else if (conf.items) {
      listPicker.items = conf.items
      listPicker.busy = false
    }

    listPicker.onDidAccept(() => {
      listPicker.hide()
      resolve(listPicker.selectedItems[0])
    })
  })
}

export interface ListPickerConfig {
  placeholder?: string
  /** 标题 */
  title?: string
  /** 列表数据 */
  items?: ListPickerItem[]
  /** 异步数据预处理钩子 */
  before?: () => Promise<ListPickerItem[]>
}

export interface ListPickerItem extends vscode.QuickPickItem {
  /** 子节点元数据 */
  source?: SwaggerJsonTreeItem
  /** 父节点元数据 */
  parent?: SwaggerJsonTreeItem
  /** 接口请求地址 */
  apiUrl?: string
}
