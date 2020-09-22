import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson, BaseTreeItemOptions } from '../core'

import { config } from '../tools'

type SwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>

export class ApiList extends BaseTreeProvider<ListItem> {
  public swaggerJsonMap: SwaggerJsonMap = new Map()

  async getChildren(element?: ListItem) {
    if (!element) {
      return this.renderRootItem()
    }

    // return this.renderRootItem()
    const rootUrl = element.options.url || ''

    return this.getListData(rootUrl).then((swaggerJsonMap) => {
      let listData = []
      switch (element.options.type) {
        case 'root':
          listData = swaggerJsonMap.get(rootUrl) || []
          return this.renderItem(listData, rootUrl)

        case 'group':
          listData = swaggerJsonMap.get(rootUrl) || []
          const itemChildren = listData[element.options.index || 0]
          return this.renderItem(itemChildren?.children || [], rootUrl)

        default:
          return Promise.resolve([])
      }
    })
  }

  /** 渲染根节点 */
  renderRootItem() {
    const { swaggerJsonUrl = [] } = config.extConfig

    return swaggerJsonUrl.map((item, index) => {
      return new ListItem({
        index,
        title: item.title || item.url,
        type: 'root',
        subTitle: item.url || '',
        collapsible: 1,
        contextValue: 'root',
        url: item.url,
      })
    })
  }

  /** 获取远程数据 */
  getListData(url?: string): Promise<SwaggerJsonMap> {
    return new Promise((resolve, reject) => {
      if (!url) return reject([])

      if (!this.swaggerJsonMap.has(url)) {
        getSwaggerJson(url)
          .then((res) => {
            this.swaggerJsonMap.set(url, parseSwaggerJson(res))
            resolve(this.swaggerJsonMap)
          })
          .catch(() => {
            reject([])
          })
      } else {
        resolve(this.swaggerJsonMap)
      }
    })
  }

  renderItem(itemList: SwaggerJsonTreeItem[], rootUrl: string): ListItem[] {
    return itemList.map((item, index) => {
      const hasChildren = item.children && item.children.length
      const options: BaseTreeItemOptions & ExtListItemConfig = {
        index,
        title: item.title,
        type: item.type,
        subTitle: item.subTitle,
        collapsible: hasChildren ? 1 : 0,
        url: rootUrl,
        contextValue: item.type,
      }

      if (!hasChildren) {
        options.command = {
          command: 'cmd.list.onSelect',
          title: item.title,
          arguments: [item],
        }
      }
      return new ListItem(options)
    })
  }

  refresh(): void {
    this.swaggerJsonMap.clear()
    this._onDidChangeTreeData.fire(undefined)
  }
}

interface ExtListItemConfig {
  url: string
}

export class ListItem extends BaseTreeItem<ExtListItemConfig> {}
