import { ProviderResult } from 'vscode'
import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson, BaseTreeItemOptions } from '../core'

import { config, formatDate, log } from '../tools'
import { ListPickerItem } from '../core'

type SwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>
interface ExtListItemConfig {
  /** swagger url */
  url: string
  /** 在浏览器中打开的链接 */
  link?: string
  /** 父级节点 */
  parent?: SwaggerJsonTreeItem
}

export class ApiList extends BaseTreeProvider<ListItem> {
  /** Swagger JSON */
  public swaggerJsonMap: SwaggerJsonMap = new Map()
  /** 接口更新时间 */
  public updateDate: string = formatDate(new Date(), 'H:I:S')

  async getChildren(element?: ListItem) {
    if (!element) {
      return this.renderRootItem()
    }

    const apiUrl = element.options.url || ''

    return this.getListData(apiUrl).then((swaggerJsonMap) => {
      let listData = []
      switch (element.options.type) {
        case 'root':
          listData = swaggerJsonMap.get(apiUrl) || []
          return this.renderItem(listData, apiUrl)

        case 'group':
          listData = swaggerJsonMap.get(apiUrl) || []
          const itemChildren = listData[element.options.index || 0]
          return this.renderItem(itemChildren?.children || [], apiUrl, itemChildren)

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
        link: item.link,
      })
    })
  }

  /**
   * 获取远程数据
   * @param url
   * @param update 每次都刷新覆盖
   */
  getListData(url?: string, update?: boolean): Promise<SwaggerJsonMap> {
    return new Promise((resolve, reject) => {
      if (!url) return reject([])

      if (this.swaggerJsonMap.has(url) && !update) return resolve(this.swaggerJsonMap)

      getSwaggerJson(url)
        .then((res) => {
          this.updateDate = formatDate(new Date(), 'H:I:S')
          this.swaggerJsonMap.set(url, parseSwaggerJson(res))
          resolve(this.swaggerJsonMap)
        })
        .catch(() => {
          reject([])
        })
    })
  }

  /** 渲染树视图节点 */
  renderItem(itemList: SwaggerJsonTreeItem[], apiUrl: string, parent?: SwaggerJsonTreeItem): ListItem[] {
    return itemList.map((item) => this.transformToListItem(item, apiUrl, parent))
  }

  /** 转换为树视图节点 */
  transformToListItem(item: SwaggerJsonTreeItem, apiUrl: string, parent?: SwaggerJsonTreeItem): ListItem {
    const hasChildren = item.children && item.children.length
    const options: BaseTreeItemOptions & ExtListItemConfig = {
      title: item.title,
      type: item.type,
      subTitle: item.subTitle,
      collapsible: hasChildren ? 1 : 0,
      url: apiUrl,
      contextValue: item.type,
      parent,
    }

    console.log(parent)

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

  /** 合并所有接口列表 - getSearchList */
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
          dirH = `${dir} - ${dirH}`
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
    console.log(item)

    if (item.parent) {
      return this.transformToListItem(item.parent, item.options.url)
    }
    return undefined
    // return item.parentNode
  }

  // command(node: ListItem) {
  //   console.log(node)
  // }

  /** 刷新 */
  public refresh(): void {
    this.swaggerJsonMap.clear()
    this._onDidChangeTreeData.fire(undefined)
  }
}

export class ListItem extends BaseTreeItem<ExtListItemConfig> {
  /** 父级节点 */
  parent?: SwaggerJsonTreeItem

  constructor(props: BaseTreeItemOptions & ExtListItemConfig) {
    super(props)
    this.parent = props.parent
  }
}
