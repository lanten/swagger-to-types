import vscode from 'vscode'
import path from 'path'
export class BaseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly options: BaseTreeItemOptions,
    // private subTitle: string,
    // public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(title, options.collapsible)
    // console.log(title, options.collapsible)
  }

  // 鼠标悬停时的 label
  get tooltip(): string {
    return `${this.label}-${this.options.subTitle}`
  }

  // 说明文本
  get description(): string {
    return this.options.subTitle
  }

  // iconPath = path.resolve(__dirname, '../../assets/icon-tree-view.svg')

  iconPath = {
    light: global.ctx.asAbsolutePath('assets/light/dependency.svg'),
    dark: global.ctx.asAbsolutePath('assets/dark/dependency.svg'),
  }

  //
  contextValue = '???'
}

// export class BaseTreeProvider implements TreeDataProvider<BaseTreeItem> {

// }
