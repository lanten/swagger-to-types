import { ProviderResult } from 'vscode'

import {
  BaseTreeProvider,
  BaseTreeItem,
  getSwaggerJson,
  parseSwaggerJson,
  BaseTreeItemOptions,
  ListPickerItem,
} from '../core'
import { config, formatDate, log, SwaggerJsonUrlItem } from '../tools'

type SwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>
interface ExtListItemConfig {
  /** swagger url */
  url: string
  /** 在浏览器中打开的链接 */
  link?: string

  key: string
  /** 父级节点 key */
  parentKey?: string
}

export class ApiList extends BaseTreeProvider<ListItem> {
  /** Swagger JSON */
  public swaggerJsonMap: SwaggerJsonMap = new Map()
  /** 接口更新时间 */
  public updateDate: string = formatDate(new Date(), 'H:I:S')

  async getChildren(element?: ListItem) {
    if (!element) {
      const { swaggerJsonUrl = [] } = config.extConfig
      return swaggerJsonUrl.map((item) => this.renderRootItem(item))
    }

    const apiUrl = element.options.url || ''

    return this.getListData(apiUrl).then((swaggerJsonMap) => {
      let listData: SwaggerJsonTreeItem[] = []
      switch (element.options.type) {
        case 'root':
          listData = swaggerJsonMap.get(apiUrl) || []
          return this.renderItem(listData, apiUrl)

        case 'group':
          listData = swaggerJsonMap.get(apiUrl) || []
          const itemChildren = listData.find((x) => x.key === element.options.key)
          return this.renderItem(itemChildren?.children || [], apiUrl)

        default:
          return Promise.resolve([])
      }
    })
  }

  /** 渲染根节点 */
  renderRootItem(item: SwaggerJsonUrlItem, collapsible?: BaseTreeItemOptions['collapsible']) {
    const rootNode = new ListItem({
      key: item.url,
      title: item.title || item.url,
      type: 'root',
      subTitle: item.url || '',
      collapsible: collapsible || 1,
      contextValue: 'root',
      url: item.url,
      link: item.link,
    })
    return rootNode
  }

  /**
   * 获取远程数据
   * @param url
   * @param update 更新覆盖
   */
  getListData(url?: string, update?: boolean): Promise<SwaggerJsonMap> {
    return new Promise((resolve, reject) => {
      if (!url) return reject([])

      if (this.swaggerJsonMap.has(url) && !update) return resolve(this.swaggerJsonMap)

      getSwaggerJson(url)
        .then((res) => {
          this.updateDate = formatDate(new Date(), 'H:I:S')
          this.swaggerJsonMap.set(url, parseSwaggerJson(res, url))
          resolve(this.swaggerJsonMap)
        })
        .catch(() => {
          reject([])
        })
    })
  }

  /**
   * 渲染树视图节点
   *
   * @param itemList
   * @param apiUrl
   * @param parent
   */
  renderItem(itemList: SwaggerJsonTreeItem[], apiUrl: string): ListItem[] {
    return itemList.map((item) => this.transformToListItem(item, apiUrl))
  }

  /**
   * 转换为树视图节点
   *
   * @param item
   * @param apiUrl
   * @param parent
   */
  transformToListItem(
    item: SwaggerJsonTreeItem,
    apiUrl: string,
    collapsible?: BaseTreeItemOptions['collapsible']
  ): ListItem {
    const hasChildren = item.children && item.children.length
    const collapsibleH = collapsible || (hasChildren ? 1 : 0)
    const options: BaseTreeItemOptions & ExtListItemConfig = {
      title: item.title,
      type: item.type,
      subTitle: item.subTitle,
      collapsible: collapsibleH,
      url: apiUrl,
      contextValue: item.type,
      key: item.key,
      parentKey: item.parentKey,
    }

    if (!hasChildren) {
      options.command = {
        command: 'cmd.list.onSelect',
        title: item.title,
        arguments: [item],
      }
    }
    return new ListItem(options)
  }

  /** 获取可供搜索选择器使用的列表 */
  public getSearchList(): Promise<ListPickerItem[]> {
    return new Promise(async (resolve) => {
      let arr: ListPickerItem[] = []
      const { swaggerJsonUrl = [] } = config.extConfig

      await this.refreshSwaggerJsonMap(true)

      this.swaggerJsonMap.forEach((list, key) => {
        const conf = swaggerJsonUrl.find((x) => x.url === key)
        if (!conf) return log.error(`swaggerJsonUrl config not found <${key}>`)
        arr = arr.concat(this.mergeSwaggerJsonMap(list, conf.url, conf.title))
      })

      resolve(arr)
    })
  }

  /**
   * 合并所有接口列表 - getSearchList
   * @param data
   * @param apiUrl
   * @param dir
   * @param parent
   */
  private mergeSwaggerJsonMap(
    data: SwaggerJsonTreeItem[],
    apiUrl: string,
    dir: string,
    parent?: SwaggerJsonTreeItem
  ): ListPickerItem[] {
    let arr: ListPickerItem[] = []

    data.forEach((v) => {
      if (v.type === 'interface') {
        arr.push({
          label: v.title,
          description: `<${v.method}> [${dir}] ${v.pathName} `,
          detail: v.subTitle,
          source: v,
          apiUrl,
          parent,
        })
      } else if (v.children) {
        let dirH = v.title
        if (dir) {
          dirH = `${dir} / ${dirH}`
        }
        arr = arr.concat(this.mergeSwaggerJsonMap(v.children, apiUrl, dirH, v))
      }
    })

    return arr
  }

  /**
   * 刷新 SwaggerJsonMap
   * @param all 是否刷新全部接口, 默认只刷新已拉取的列表
   */
  refreshSwaggerJsonMap(all?: boolean): Promise<SwaggerJsonMap[]> {
    const { swaggerJsonUrl = [] } = config.extConfig
    const queryList: Promise<SwaggerJsonMap>[] = []
    swaggerJsonUrl.forEach((v) => {
      if (!this.swaggerJsonMap.has(v.url) && !all) return
      queryList.push(this.getListData(v.url))
    })

    return Promise.all(queryList)
  }

  /** 获取父级元素 */
  getParent(item: ListItem): ProviderResult<ListItem> {
    const { parentKey, type, url } = item.options

    let parentNode: ProviderResult<ListItem> = void 0

    switch (type) {
      case 'interface':
        const groupNode = this.swaggerJsonMap.get(url)?.find((x) => x.key === parentKey)
        if (groupNode) {
          parentNode = this.transformToListItem(groupNode, item.options.url)
        } else {
          log.error(`<getParent> [${parentKey}] groupNode not found`)
        }
        break

      case 'group':
        const rootNode = config.extConfig.swaggerJsonUrl.find((x) => x.url === parentKey)
        if (rootNode) {
          parentNode = this.renderRootItem(rootNode)
        } else {
          log.error(`<getParent> [${parentKey}] rootNode not found`)
        }
        break
    }

    return parentNode
  }

  /** 刷新 */
  public refresh(): void {
    this.swaggerJsonMap.clear()
    this._onDidChangeTreeData.fire(undefined)
  }
}

export class ListItem extends BaseTreeItem<ExtListItemConfig> {}
