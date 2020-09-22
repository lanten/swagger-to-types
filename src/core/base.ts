import vscode from 'vscode'

import { WORKSPACE_PATH } from '../tools'

export class BaseTreeItem extends vscode.TreeItem {
  // 标题
  public label: string

  constructor(public readonly options: BaseTreeItemOptions) {
    super(options.title, options.collapsible)
    this.label = options.title
    // this.command = options.command
    // this.tooltip = `${this.label} - ${options.subTitle}`
    // this.description = options.subTitle
  }

  // @ts-ignore
  get command() {
    return this.options.command
  }

  // 鼠标悬停时的 label
  // @ts-ignore
  get tooltip(): string {
    return `${this.label} - ${this.options.subTitle}`
  }

  // 说明文本
  // @ts-ignore
  get description(): string {
    return this.options.subTitle
  }

  // @ts-ignore
  get iconPath() {
    if (this.options.type) {
      return {
        light: global.ctx.asAbsolutePath(`assets/icons/${this.options.type}.light.svg`),
        dark: global.ctx.asAbsolutePath(`assets/icons/${this.options.type}.dark.svg`),
      }
    }
  }

  contextValue = ''
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
