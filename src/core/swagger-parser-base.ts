import { OpenAPIV3 } from 'openapi-types'
import { randomId, SwaggerJsonUrlItem, toCamel } from '../tools'

export abstract class BaseParser {
  public tagsMap = {}
  public result: SwaggerJsonTreeItem[] = []

  constructor(public swaggerJson: OpenAPIV3.Document, public configItem: SwaggerJsonUrlItem) {
    const { tags } = swaggerJson
    if (tags && tags.length) {
      tags.forEach((v) => {
        this.addGroup({ name: v.name, description: v.description })
      })
    }

    // console.log(swaggerJson, configItem)
  }

  /** 添加分组 */
  addGroup(item: { name: string; description?: string }) {
    const itemIndex = this.result.length
    this.tagsMap[item.name] = itemIndex
    const tagItem: SwaggerJsonTreeItem = {
      key: randomId(`${item.name}-xxxxxx`),
      parentKey: this.configItem.url,
      title: item.name,
      subTitle: item.description || '',
      type: 'group',
    }

    if (this.configItem.savePath) {
      tagItem.savePath = this.configItem.savePath
    }

    this.result.push(tagItem)
  }

  /** 添加分组内元素 */
  pushGroupItem(tags: string[], itemRes: SwaggerJsonTreeItem) {
    if (this.configItem.savePath) {
      itemRes.savePath = this.configItem.savePath
    }

    if (tags && tags.length) {
      tags.forEach((tagStr: string) => {
        let tagIndex = this.tagsMap[tagStr]
        if (tagIndex === undefined) {
          tagIndex = this.tagsMap['未知分组']
          if (!tagIndex) {
            this.addGroup({ name: '未知分组', description: '分组ID在TAG表中未找到 (无效 Tag)' })
            tagIndex = this.tagsMap['未知分组']
          }
        }
        const tagVal = this.result[tagIndex]
        itemRes.parentKey = tagVal.key

        if (this.result[tagIndex].children && Array.isArray(tagVal.children)) {
          tagVal.children?.push(itemRes)
        } else {
          tagVal.children = [itemRes]
        }
      })
    } else {
      this.result.push(itemRes)
    }
  }

  public getKebabNameByPath(path: string) {
    return path.slice(1, path.length).replace(/\//g, '-').replace(/\s/g, '')
  }

  public getCamelNameByKebab(kebab: string) {
    return toCamel(kebab)
      .replace(/[\/\s]/g, '')
      .replace(/[\[\]<>(){|}\*]/g, '$')
  }

  /** 执行解析 */
  abstract parse(): SwaggerJsonTreeItem[]
}
