import vscode, { TreeDataProvider, TreeItem } from 'vscode'
import path from 'path'
import fs from 'fs'

import { BaseTreeItem } from '@/base'

// import { localize, REG_KEY } from '@/utils'

export class ApiList implements TreeDataProvider<BaseTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BaseTreeItem | undefined> = new vscode.EventEmitter<
    BaseTreeItem | undefined
  >()
  readonly onDidChangeTreeData: vscode.Event<BaseTreeItem | undefined> = this._onDidChangeTreeData.event

  constructor(private workspaceRoot = vscode.workspace.rootPath || '') {}

  getTreeItem(element: BaseTreeItem): TreeItem {
    // console.log({ element })
    return element
  }

  getChildren(element?: BaseTreeItem): Thenable<BaseTreeItem[]> {
    // console.log('123333', element)
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.title, 'package.json'))
      )
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json')
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath))
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json')
        return Promise.resolve([])
      }
    }
  }

  private getDepsInPackageJson(packageJsonPath: string): BaseTreeItem[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const toDep = (moduleName: string, version: string): BaseTreeItem => {
        if (this.pathExists(path.join(this.workspaceRoot || '', 'node_modules', moduleName))) {
          return new BaseTreeItem(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed)
        } else {
          return new BaseTreeItem(moduleName, version, vscode.TreeItemCollapsibleState.None, {
            command: 'extension.openPackageOnNpm',
            title: 'asdasdsad',
            arguments: [moduleName],
          })
        }
      }

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
        : []
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
        : []
      return deps.concat(devDeps)
    } else {
      return []
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }

    return true
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}

export class ApiListItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(version, collapsibleState)
    console.log(label, collapsibleState)
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`
  }

  get description(): string {
    return 'hahahahhahah'
  }

  // iconPath = path.resolve(__dirname, '../../assets/icon-tree-view.svg')

  // iconPath = {
  //   light: path.join(__dirname, '../../assets/light/dependency.svg'),
  //   dark: path.join(__dirname, '../../assets/dark/dependency.svg'),
  // }

  contextValue = 'dependency'
}
