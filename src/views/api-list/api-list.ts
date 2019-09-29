import vscode from 'vscode'
import path from 'path'
import fs from 'fs'
import { registerApiListCommands } from '@/commands'

import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson } from '@/core'

// import { localize, REG_KEY } from '@/utils'

export class ApiList extends BaseTreeProvider<ApiListItem> {
  public treeList: SwaggerJsonTreeItem[] = []

  constructor() {
    super()
    registerApiListCommands(this)
  }

  getChildren(element?: ApiListItem): Thenable<ApiListItem[]> {
    console.log('getChildren element =>', element)

    return this.getListData().then(treeList => {
      if (element) {
        const { index = 0 } = element.options
        return this.renderItem(treeList[index].children || [])
      } else {
        return this.renderItem(treeList)
      }
    })
  }

  getListData(): Promise<SwaggerJsonTreeItem[]> {
    return new Promise(resolve => {
      if (!this.treeList.length) {
        getSwaggerJson().then(res => {
          console.log('request')
          this.treeList = parseSwaggerJson(res)
          resolve(this.treeList)
        })
      } else {
        resolve(this.treeList)
      }
    })
  }

  renderItem(itemList: SwaggerJsonTreeItem[]): ApiListItem[] {
    return itemList.map((item, index) => {
      const hasChildren = item.children && item.children.length
      const options: BaseTreeItemOptions = {
        index,
        title: item.title,
        type: item.type,
        subTitle: item.subTitle,
        collapsible: hasChildren ? 1 : 0,
      }

      if (!hasChildren) {
        options.command = {
          command: 'api.list.onSelect',
          title: item.title,
          arguments: [item],
        }
      }
      return new ApiListItem(options)
    })
  }

  refresh(): void {
    this.treeList = []
    this._onDidChangeTreeData.fire()
  }
}

export class ApiListItem extends BaseTreeItem {}
