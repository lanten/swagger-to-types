import fs from 'fs'
import path from 'path'
import { ProviderResult, window } from 'vscode'
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types'

import {
  BaseTreeProvider,
  BaseTreeItem,
  getSwaggerJson,
  parseSwaggerJson,
  OpenAPIV3Parser,
  BaseTreeItemOptions,
  ListPickerItem,
  renderToInterface,
} from '../core'
import {
  config,
  formatDate,
  log,
  SwaggerJsonUrlItem,
  saveDocument,
  WORKSPACE_PATH,
  localize,
  showLoading,
} from '../tools'

type SwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>
interface ExtListItemConfig {
  configItem: SwaggerJsonUrlItem
  // /** swagger url */
  // url: string
  // /** 在浏览器中打开的链接 */
  // link?: string

  key: string
  /** 父级节点 key */
  parentKey?: string
}

export class ViewList extends BaseTreeProvider<ListItem> {
  /** Swagger JSON */
  public swaggerJsonMap: SwaggerJsonMap = new Map()
  private interFacePathNameMap = new Map<string, SwaggerJsonTreeItem>()
  /** 接口更新时间 */
  public updateDate: string = formatDate(new Date(), 'H:I:S')
  public globalSavePath = path.resolve(WORKSPACE_PATH || '', config.extConfig.savePath)

  constructor() {
    super()
    this.getSearchList()
  }

  async getChildren(element?: ListItem) {
    if (!element) {
      const { swaggerJsonUrl = [] } = config.extConfig
      return swaggerJsonUrl.map((item) => this.renderRootItem(item))
    }

    const configItem = element.options.configItem

    return this.getListData(configItem).then((swaggerJsonMap) => {
      let listData: SwaggerJsonTreeItem[] = []
      switch (element.options.type) {
        case 'root':
          listData = swaggerJsonMap.get(configItem.url) || []
          return this.renderItem(listData, configItem)

        case 'group':
          listData = swaggerJsonMap.get(configItem.url) || []
          const itemChildren = listData.find((x) => x.key === element.options.key)
          return this.renderItem(itemChildren?.children || [], configItem)

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
      // url: item.url,
      // link: item.link,
      configItem: item,
    })
    return rootNode
  }

  /**
   * 获取远程数据
   * @param item
   * @param update 更新覆盖
   */
  getListData(item: SwaggerJsonUrlItem, update?: boolean): Promise<SwaggerJsonMap> {
    return new Promise((resolve) => {
      if (!item.url) return resolve(this.swaggerJsonMap) // reject map

      if (this.swaggerJsonMap.has(item.url) && !update) return resolve(this.swaggerJsonMap)

      getSwaggerJson(item.url)
        .then((res) => {
          this.updateDate = formatDate(new Date(), 'H:I:S')
          if (res.swagger) {
            this.swaggerJsonMap.set(item.url, parseSwaggerJson(res as OpenAPIV2.Document, item))
          } else if (res.openapi) {
            this.swaggerJsonMap.set(item.url, new OpenAPIV3Parser(res as OpenAPIV3.Document, item).parse())
          }
          resolve(this.swaggerJsonMap)
        })
        .catch(() => {
          resolve(this.swaggerJsonMap) // reject map
        })
    })
  }

  /**
   * 渲染树视图节点
   *
   * @param itemList
   * @param configItem
   * @param parent
   */
  renderItem(itemList: SwaggerJsonTreeItem[], configItem: SwaggerJsonUrlItem): ListItem[] {
    return itemList.map((item) => this.transformToListItem(item, configItem))
  }

  /**
   * 转换为树视图节点
   *
   * @param item
   * @param configItem
   * @param parent
   */
  transformToListItem(
    item: SwaggerJsonTreeItem,
    configItem: SwaggerJsonUrlItem,
    collapsible?: BaseTreeItemOptions['collapsible']
  ): ListItem {
    const hasChildren = item.children && item.children.length
    const collapsibleH = collapsible || (hasChildren ? 1 : 0)
    const options: BaseTreeItemOptions & ExtListItemConfig = {
      title: item.title,
      type: item.type,
      subTitle: item.subTitle,
      collapsible: collapsibleH,
      configItem,
      // url: configItem.url,
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

  /**
   * 刷新 SwaggerJsonMap
   * @param all 是否刷新全部接口, 默认只刷新已拉取的列表
   */
  refreshSwaggerJsonMap(all?: boolean): Promise<SwaggerJsonMap[]> {
    const { swaggerJsonUrl = [] } = config.extConfig
    const queryList: Promise<SwaggerJsonMap>[] = []
    swaggerJsonUrl.forEach((v) => {
      if (!this.swaggerJsonMap.has(v.url) && !all) return
      queryList.push(this.getListData(v))
    })

    return Promise.all(queryList)
  }

  /** 获取可供搜索选择器使用的列表 */
  public getSearchList(): Promise<ListPickerItem[]> {
    const stopLoading = showLoading(localize.getLocalize('text.querySwaggerData'))
    return new Promise(async (resolve) => {
      let arr: ListPickerItem[] = []
      const { swaggerJsonUrl = [] } = config.extConfig

      await this.refreshSwaggerJsonMap(true)

      this.swaggerJsonMap.forEach((list, key) => {
        const conf = swaggerJsonUrl.find((x) => x.url === key)
        if (!conf) return log.error(`swaggerJsonUrl config not found (${key})`)
        arr = arr.concat(this.mergeSwaggerJsonMap(list, conf, conf.title))
      })

      stopLoading()
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
    configItem: SwaggerJsonUrlItem,
    dir: string,
    parent?: SwaggerJsonTreeItem
  ): ListPickerItem[] {
    let arr: ListPickerItem[] = []

    data.forEach((v) => {
      if (v.type === 'interface') {
        if (v.pathName) {
          this.setInterFacePathNameMap(v.pathName, v.savePath, v)
        }
        arr.push({
          label: v.title,
          description: `<${v.method}> [${dir}] ${v.pathName} `,
          detail: v.subTitle,
          source: v,
          configItem,
          parent,
        })
      } else if (v.children) {
        let dirH = v.title
        if (dir) {
          dirH = `${dir} / ${dirH}`
        }
        arr = arr.concat(this.mergeSwaggerJsonMap(v.children, configItem, dirH, v))
      }
    })

    return arr
  }

  setInterFacePathNameMap(pathName: string, savePath: string = config.extConfig.savePath, item: SwaggerJsonTreeItem) {
    this.interFacePathNameMap.set(`${savePath}/${pathName}`, item)
  }

  getInterFacePathNameMap(pathName: string, savePath: string = config.extConfig.savePath) {
    return this.interFacePathNameMap.get(`${savePath}/${pathName}`)
  }

  /** 获取父级元素 */
  getParent(item: ListItem): ProviderResult<ListItem> {
    const { parentKey, type, configItem } = item.options

    let parentNode: ProviderResult<ListItem> = void 0

    switch (type) {
      case 'interface':
        const groupNode = this.swaggerJsonMap.get(configItem.url)?.find((x) => x.key === parentKey)
        if (groupNode) {
          parentNode = this.transformToListItem(groupNode, configItem)
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

  /** 保存接口到本地 */
  public async saveInterface(
    itemSource: TreeInterface | ListItem | SwaggerJsonUrlItem,
    filePath?: string
  ): Promise<'no-change' | void> {
    const item = itemSource as TreeInterface
    const { compareChanges } = config.extConfig
    if (!item.pathName) return Promise.reject('SaveInterface Error')

    const savePath = item.savePath ? path.resolve(WORKSPACE_PATH || '', item.savePath) : this.globalSavePath

    const filePathH = filePath ?? path.join(savePath, `${item.pathName}.d.ts`)
    const nextStr = renderToInterface(item)

    if (compareChanges && fs.existsSync(filePathH)) {
      const currentStr = fs.readFileSync(filePathH, 'utf-8')

      const REG_UPDATE_DATE = /@update[^\n]+/
      if (currentStr.replace(REG_UPDATE_DATE, '') === nextStr.replace(REG_UPDATE_DATE, '')) {
        return Promise.resolve('no-change')
      }
    }

    return saveDocument(nextStr, filePathH)
  }

  /** 批量保存分组到本地 */
  public async saveInterfaceGroup(item: ListItem) {
    return new Promise(async (resolve, reject) => {
      // await this._refresh()
      const listData = this.swaggerJsonMap.get(item.options.configItem.url) || []
      const itemChildren: ListItem[] | undefined = listData.find((x) => x.key === item.options.key)?.children
      if (itemChildren && itemChildren.length) {
        for (let index = 0; index < itemChildren.length; index++) {
          await this.saveInterface(itemChildren[index])
        }
        resolve(void 0)
      } else {
        reject('No Children!')
      }
    })
  }

  /** 刷新 */
  public refresh() {
    // 0.5 秒防抖, 避免重复刷新占用大量资源
    this.debounce(() => this._refresh(), 500)
  }

  public async _refresh() {
    this.swaggerJsonMap.clear()
    this.interFacePathNameMap.clear()
    await this.getSearchList()
    this._onDidChangeTreeData.fire(undefined)
    log.info('refresh: view.list')
  }

  /** settings.json 文件变更时触发 */
  public onConfigurationRefresh() {
    const { savePath } = config.extConfig
    this.globalSavePath = path.resolve(WORKSPACE_PATH || '', savePath)
    this.refresh()
  }
}

export class ListItem extends BaseTreeItem<ExtListItemConfig> {}
