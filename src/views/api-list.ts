import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson } from '../core'

import { config } from '../tools'

export class ApiList extends BaseTreeProvider<ApiListItem> {
  public treeList: SwaggerJsonTreeItem[] = []

  async getChildren(element?: ApiListItem) {
    return this.getListData().then((treeList) => {
      if (element) {
        const { index = 0 } = element.options
        return this.renderItem(treeList[index].children || [])
      } else {
        return this.renderItem(treeList)
      }
    })
  }

  getListData(): Promise<SwaggerJsonTreeItem[]> {
    return new Promise((resolve, reject) => {
      const { swaggerJsonUrl = [] } = config.extConfig
      const swaggerJsonConfig = swaggerJsonUrl[0]
      if (!swaggerJsonConfig) return resolve([])
      if (!this.treeList.length) {
        getSwaggerJson(swaggerJsonConfig.url)
          .then((res) => {
            this.treeList = parseSwaggerJson(res)
            resolve(this.treeList)
          })
          .catch(() => {
            reject([])
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
    this._onDidChangeTreeData.fire(undefined)
  }
}

export class ApiListItem extends BaseTreeItem {}