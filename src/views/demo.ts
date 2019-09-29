import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<
    Dependency | undefined
  >()
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    if (element) {
      const a = this.getDepsInPackageJson(
        path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
      )
      console.log(a)
      return Promise.resolve(a)
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json')
      if (this.pathExists(packageJsonPath)) {
        const a = this.getDepsInPackageJson(packageJsonPath)
        return Promise.resolve(a)
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json')
        return Promise.resolve([])
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const toDep = (moduleName: string, version: string): Dependency => {
        if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
          return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed)
        } else {
          return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
            command: 'extension.openPackageOnNpm',
            title: '',
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
      console.log(devDeps)
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
}

export class Dependency extends vscode.TreeItem {
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

  iconPath = {
    light: path.resolve(__dirname, '../../assets/icon-tree-view.svg'),
    dark: path.resolve(__dirname, '../../assets/icon-tree-view.svg'),
  }

  contextValue = 'dependency'
}
