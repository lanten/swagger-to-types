import vscode from 'vscode'
import path from 'path'

export class BaseTreeItem extends vscode.TreeItem {
  // 标题
  public label: string

  constructor(public readonly options: BaseTreeItemOptions) {
    super(options.title, options.collapsible)
    this.label = options.title
  }

  // get label() {
  //   return this.options.title
  // }

  get command() {
    return this.options.command
  }

  // 鼠标悬停时的 label
  get tooltip(): string {
    return `${this.label} - ${this.options.subTitle}`
  }

  // 说明文本
  get description(): string {
    return this.options.subTitle
  }

  get iconPath() {
    if (this.options.type) {
      return {
        light: global.ctx.asAbsolutePath(`assets/icons/${this.options.type}.light.svg`),
        dark: global.ctx.asAbsolutePath(`assets/icons/${this.options.type}.dark.svg`),
      }
    }
  }

  contextValue = '???'
}

export class BaseTreeProvider<T> implements vscode.TreeDataProvider<T> {
  public _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<T | undefined>()
  public readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event
  public readonly workspaceRoot = vscode.workspace.rootPath || ''

  // constructor() {}

  getTreeItem(element: T): vscode.TreeItem {
    return element
  }

  getChildren(element?: T): Thenable<T[]> {
    return Promise.resolve([])
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}
