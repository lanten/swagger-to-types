import { BaseParser } from './data-parser'

import type { OpenAPIV3 } from 'openapi-types'

import { randomId } from '../tools'

export class OpenAPIV3Parser extends BaseParser {
  parse() {
    const { paths } = this.swaggerJson
    for (const path in paths) {
      const pathItem = paths[path]
      if (!pathItem) continue
      const pathItemKeys = Object.keys(pathItem)
      const multipleMethod = pathItemKeys.length > 1
      pathItemKeys.forEach((method) => this.parseMethodItem(path, pathItem, method, multipleMethod))
    }

    return this.result
  }

  /** 解析接口方法 */
  parseMethodItem(path: string, item: OpenAPIV3.PathItemObject, method: string, multipleMethod: boolean) {
    const { description, summary } = item
    const fileName = this.getKebabNameByPath(path)
    const pathName = this.getCamelNameByKebab(fileName)
    const desc = description || summary || '无说明接口'

    const params = this.parseParams(item.parameters as OpenAPIV3.ParameterObject[])

    console.log(params)
    const response: any = {}

    const itemRes: SwaggerJsonTreeItem & TreeInterface = {
      groupName: this.configItem.title,
      type: 'interface',
      key: randomId(`${desc}-xxxxxx`),
      basePath: this.configItem.basePath || '',
      parentKey: '',
      method,
      params,
      response,
      title: desc,
      subTitle: path,
      path,
      pathName,
      fileName,
      ...item,
    }

    // if (tags && tags.length) {
    //   tags.forEach((tagStr: string) => {
    //     let tagIndex = tagsMap[tagStr]
    //     if (tagIndex === undefined) {
    //       tagIndex = tagsMap['未知分组']
    //       if (!tagIndex) {
    //         addTag({ name: '未知分组', description: '分组ID在TAG表中未找到 (无效 Tag)' })
    //         tagIndex = tagsMap['未知分组']
    //       }
    //     }
    //     const tagVal = res[tagIndex]
    //     itemRes.parentKey = tagVal.key

    //     if (res[tagIndex].children && Array.isArray(tagVal.children)) {
    //       tagVal.children?.push(itemRes)
    //     } else {
    //       tagVal.children = [itemRes]
    //     }
    //   })
    // } else {
    //   res.push(itemRes)
    // }
  }

  parseParams(parameters: OpenAPIV3.ParameterObject[]) {
    let params: any[] = []

    if (!parameters || !parameters.length) {
      params = []
    } else {
      const bodyIndex = parameters.findIndex((x: any) => x.in === 'body')

      if (bodyIndex !== -1) {
        const paramsBody = parameters[bodyIndex]
        const paramsSource = paramsBody.schema as OpenAPIV3.SchemaObject | undefined
        if (paramsSource && paramsSource.properties) {
          const { properties } = paramsSource
          for (const name in properties) {
            const val = properties[name]
            const obj = {
              name,
              ...val,
            }

            params.push(obj)
          }
        }
      } else {
        // 忽略 headers
        params = parameters.filter((x: any) => x.in !== 'header')
      }
    }

    return params
  }
}
