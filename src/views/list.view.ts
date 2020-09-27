// import vscode from 'vscode'
import { BaseTreeProvider, BaseTreeItem, getSwaggerJson, parseSwaggerJson, BaseTreeItemOptions } from '../core'

import { config } from '../tools'
import { ListPickerItem } from '../core'

type SwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>
interface ExtListItemConfig {
  /** swagger url */
  url: string
  /** 在浏览器中打开的链接 */
  link?: string
}

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
        link: item.link,
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

  /** 渲染树视图节点 */
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

  /** 获取可供搜索选择器使用的列表 */
  public getSearchList(): Promise<ListPickerItem[]> {
    return new Promise(async (resolve) => {
      let arr: ListPickerItem[] = []
      const { swaggerJsonUrl = [] } = config.extConfig

      await this.refreshSwaggerJsonMap(true)

      // console.log(this.swaggerJsonMap.keys(), JSON.stringify(this.swaggerJsonMap))

      this.swaggerJsonMap.forEach((list, key) => {
        console.log(list)
        const conf = swaggerJsonUrl.find((x) => x.url === key)
        arr = arr.concat(this.mergeSwaggerJsonMap(list, conf?.title))
      })

      resolve(arr)
    })
  }

  /** 合并所有接口列表 - getSearchList */
  private mergeSwaggerJsonMap(data: SwaggerJsonTreeItem[], dir?: string): ListPickerItem[] {
    let arr: ListPickerItem[] = []

    data.forEach((v) => {
      if (v.type === 'interface') {
        arr.push({
          label: v.title,
          description: `<${v.method}> [${dir}] ${v.pathName} `,
          detail: v.subTitle,
          source: v,
        })
      } else if (v.children) {
        let dirH = v.title
        if (dir) {
          dirH = `${dir} - ${dirH}`
        }
        arr = arr.concat(this.mergeSwaggerJsonMap(v.children, dirH))
      }
    })

    // this.swaggerJsonMap.forEach((list) => {
    //   console.log(list)
    //   arr = arr.concat(
    //     list.map((v) => ({
    //       label: v.title,
    //       description: v.subTitle,
    //       detail: v.pathName,
    //     }))
    //   )
    // })

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

  // command(node: ListItem) {
  //   console.log(node)
  // }

  /** 刷新 */
  public refresh(): void {
    this.swaggerJsonMap.clear()
    this._onDidChangeTreeData.fire(undefined)
  }
}

export class ListItem extends BaseTreeItem<ExtListItemConfig> {}
