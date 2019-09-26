import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

import { localize, REG_KEY } from '@/utils'

export class ApiList implements vscode.TreeDataProvider<ApiListItem> {
  // private _onDidChangeTreeData: vscode.EventEmitter<
  //   ApiListItem | undefined
  // > = new vscode.EventEmitter<ApiListItem | undefined>()
  // readonly onDidChangeTreeData: vscode.Event<ApiListItem | undefined> = this._onDidChangeTreeData
  //   .event
  private workspaceRoot = vscode.workspace.rootPath

  constructor() {}

  getChildren(element?: ApiListItem): Thenable<ApiListItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
        )
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

  getTreeItem(element: ApiListItem): vscode.TreeItem {
    console.log({ element })
    return element
  }

  private getDepsInPackageJson(packageJsonPath: string): ApiListItem[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const toDep = (moduleName: string, version: string): ApiListItem => {
        if (this.pathExists(path.join(this.workspaceRoot || '', 'node_modules', moduleName))) {
          return new ApiListItem(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed)
        } else {
          return new ApiListItem(moduleName, version, vscode.TreeItemCollapsibleState.None, {
            command: 'extension.openPackageOnNpm',
            title: '',
            arguments: [moduleName],
          })
        }
      }

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep =>
            toDep(dep, packageJson.dependencies[dep])
          )
        : []
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep =>
            toDep(dep, packageJson.devDependencies[dep])
          )
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
    // this._onDidChangeTreeData.fire()
  }
}

export class ApiListItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`
  }

  get description(): string {
    return this.version
  }

  // iconPath = path.resolve(__dirname, '../../assets/icon-tree-view.svg')

  iconPath = {
    light: path.resolve(__dirname, '../../assets/icon-tree-view.svg'),
    dark: path.resolve(__dirname, '../../assets/icon-tree-view.svg'),
  }

  contextValue = 'list-item'
}
