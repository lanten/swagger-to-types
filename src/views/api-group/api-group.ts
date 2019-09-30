import vscode from 'vscode'

import { registerApiGroupCommands } from '@/commands'
import { BaseTreeProvider, BaseTreeItem } from '@/core'
import { ApiList } from '../api-list'
export class ApiGroup extends BaseTreeProvider<ApiGroupItem> {
  public treeList: SwaggerJsonUrlItem[] = []

  getSwaggerSettings(): SwaggerJsonUrlItem[] {
    return $ext.config.extConfig.swaggerJsonUrl || []
  }

  getChildren(): Thenable<ApiGroupItem[]> {
    const treeItems = this.renderItem(this.getSwaggerSettings())

    return Promise.resolve(treeItems)
  }

  renderItem(itemList: SwaggerJsonUrlItem[]): ApiGroupItem[] {
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
          arguments: [{ ...item, index }],
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
