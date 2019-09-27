import vscode from 'vscode'

export class BaseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    private subTitle: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(title, collapsibleState)
    console.log(title, collapsibleState)
  }

  get tooltip(): string {
    return `${this.label}-${this.subTitle}`
  }

  get description(): string {
    return this.subTitle
  }

  // iconPath = path.resolve(__dirname, '../../assets/icon-tree-view.svg')

  // iconPath = {
  //   light: path.join(__dirname, '../../assets/light/dependency.svg'),
  //   dark: path.join(__dirname, '../../assets/dark/dependency.svg'),
  // }

  contextValue = 'dependency'
}

// export class BaseTreeProvider implements TreeDataProvider<BaseTreeItem> {

// }
