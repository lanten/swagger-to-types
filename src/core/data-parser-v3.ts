import type { OpenAPIV3 } from 'openapi-types'

import { BaseParser, handleType } from './data-parser'
import { randomId } from '../tools'

interface DereferenceItem extends Required<OpenAPIV3.OperationObject> {}

export class OpenAPIV3Parser extends BaseParser {
  parse() {
    const { paths } = this.swaggerJson
    for (const path in paths) {
      const pathItem = paths[path]
      if (!pathItem) continue
      const pathItemKeys = Object.keys(pathItem)
      const multipleMethod = pathItemKeys.length > 1
      pathItemKeys.forEach((method) => this.parseMethodItem(path, pathItem[method], method, multipleMethod))
    }

    return this.result
  }

  /** 解析接口方法 */
  parseMethodItem(path: string, item: DereferenceItem, method: string, multipleMethod: boolean) {
    const { description, summary, tags, operationId, parameters, responses } = item
    const fileName = this.getKebabNameByPath(path)
    const pathName = this.getCamelNameByKebab(fileName)
    const desc = description || summary || '无说明接口'

    const params = this.parseParams(item.parameters as OpenAPIV3.ParameterObject[])

    console.log('params---', params)

    console.log(desc, item)

    const response = this.parseResponse(responses)

    const itemRes: SwaggerJsonTreeItem = {
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
      operationId,
    }

    this.pushGroupItem(tags, itemRes)
  }

  /** 解析接口参数 */
  parseParams(parameters: OpenAPIV3.ParameterObject[]) {
    let params: TreeInterfaceParamsItem[] = []

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
            const val = properties[name] as OpenAPIV3.SchemaObject
            const obj = {
              name,
              ...val,
            }

            params.push(obj)
          }
        }
      } else {
        parameters.forEach((val) => {
          if (val.in === 'header') return // 忽略 headers
          const schema = (val.schema || {}) as OpenAPIV3.SchemaObject
          const parameItem: TreeInterfacePropertiesItem = {
            ...val,
            itemsType: schema.type,
            item: this.parseParams(schema),
          }
          params.push(parameItem)
        })
      }
    }

    return params
  }

  /** 解析接口返回值 */
  parseResponse(responses: OpenAPIV3.ResponsesObject): TreeInterfacePropertiesItem | string {
    const responseBody = (responses[200] || {}) as OpenAPIV3.ResponseObject

    const content = Object.values(responseBody.content || {})
    const schema = content[0].schema as OpenAPIV3.SchemaObject | undefined

    if (!schema) return 'any'

    const { properties, type, required } = schema

    if (!properties) return handleType(type)

    for (const key in properties) {
      const val = properties[key] as OpenAPIV3.SchemaObject
      const obj: TreeInterfacePropertiesItem = {
        name: key,
        type: handleType(val.type),
        required: required && required.length && required.includes(key) ? true : false,
        description: val.description,
        titRef: val.title,
      }

      // if ((val.originalRef && val.originalRef != originalRef) || (val.$ref && val.$ref != $ref)) {
      //   obj.item = getSwaggerJsonRef(val, definitions)
      // }

      // if (val.items) {
      //   let schema
      //   if (val.items.schema) {
      //     schema = val.items.schema
      //   } else if (val.items.originalRef || val.items.$ref) {
      //     schema = val.items
      //   } else if (val.items.type) {
      //     obj.itemsType = val.items.type
      //   } else if (val.originalRef || val.$ref) {
      //     schema = val
      //   }

      //   if (schema && (schema.originalRef != originalRef || schema.$ref != $ref)) {
      //     obj.item = getSwaggerJsonRef(schema, definitions)
      //   }
      // }

      // propertiesList.push(obj)
    }

    return 'number'
  }

  /** 解析属性 */
  parseProperties(properties: OpenAPIV3.SchemaObject): TreeInterfacePropertiesItem {
    // return
  }
}
