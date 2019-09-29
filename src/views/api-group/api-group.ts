import vscode from 'vscode'
import path from 'path'
import fs from 'fs'
import { registerApiGroupCommands } from '@/commands'

import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson } from '@/core'

// import { localize, REG_KEY } from '@/utils'

export class ApiGroup extends BaseTreeProvider<ApiGroupItem> {
  public treeList: GroupTreeItem[] = []

  constructor() {
    super()
    registerApiGroupCommands(this)
  }

  getSwaggerSettings(): GroupTreeItem[] {
    const settings: GroupTreeItem[] = vscode.workspace.getConfiguration().get('swaggerJsonUrl') || []
    return settings
  }

  getChildren(): Thenable<ApiGroupItem[]> {
    const treeItems = this.renderItem(this.getSwaggerSettings())

    return Promise.resolve(treeItems)
  }

  renderItem(itemList: GroupTreeItem[]): ApiGroupItem[] {
    return itemList.map((item, index) => {
      const title = item.title || item.url
      const options: BaseTreeItemOptions = {
        index,
        title,
        type: 'group',
        subTitle: item.title ? item.url : '',
        collapsible: 0,
        command: {
          title,
          command: 'api.group.onSelect',
          arguments: [item],
        },
      }

      return new ApiGroupItem(options)
    })
  }

  refresh(): void {
    this.treeList = []
    this._onDidChangeTreeData.fire()
  }
}

export class ApiGroupItem extends BaseTreeItem {}
