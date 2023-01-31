import { OpenAPIV2 } from 'openapi-types'

import { toCamel, randomId, SwaggerJsonUrlItem, log, getValueByPath, config } from '../tools'

export function parseSwaggerJson(
  swaggerJson: OpenAPIV2.Document,
  configItem: SwaggerJsonUrlItem
): SwaggerJsonTreeItem[] {
  const { tags, paths, definitions } = swaggerJson
  const res: SwaggerJsonTreeItem[] = []

  // console.log(swaggerJson)

  function addTag(item: { name: string; description?: string }) {
    const itemIndex = res.length
    tagsMap[item.name] = itemIndex
    const tagItem: SwaggerJsonTreeItem = {
      key: randomId(`${item.name}-xxxxxx`),
      parentKey: configItem.url,
      title: item.name,
      subTitle: item.description || '',
      savePath: configItem.savePath || config.extConfig.savePath,
      type: 'group',
    }

    res.push(tagItem)
  }

  const tagsMap = {}
  if (tags && tags.length) {
    tags.forEach((v) => {
      addTag({ name: v.name, description: v.description })
    })
  }

  /**
   *
   * @param path
   * @param pathItem
   * @param method
   * @param multipleMethod 是否具有多个方法
   */
  function parseMethodItem(path: string, pathItem: OpenAPIV2.OperationObject, method: string, multipleMethod: boolean) {
    const { summary, description, tags, parameters = [], responses = {}, ...item } = pathItem[method]
    let fileName = path.slice(1, path.length).replace(/\//g, '-')
    if (multipleMethod) fileName += `-${method.toLowerCase()}`
    const pathName = toCamel(fileName)
      .replace(/[-\/\s]/, '')
      .replace(/[\[\]<>(){|}\*]/g, '$')

    let params: any[] = []
    if (!parameters || !parameters.length) {
      params = []
    } else {
      const bodyIndex = parameters.findIndex((x: any) => x.in === 'body')

      if (bodyIndex !== -1) {
        const paramsBody = parameters[bodyIndex]
        const paramsSource = paramsBody.schema && getSwaggerJsonRef(paramsBody.schema, definitions)

        if (paramsBody?.schema?.type && !paramsSource?.properties?.length) {
          paramsSource?.properties?.push({
            name: '____body_root_param____', // TAG 根级参数处理
            description: paramsBody.description,
            ...paramsBody.schema,
          })
        }

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

    let response: any = {}

    if (responses) {
      const responseBody = responses[200] || {}
      try {
        response = getSwaggerJsonRef(responseBody.schema, definitions)
      } catch (error) {
        // DESC 将错误信息输出到 devTools 控制台, 避免记录过多日志.
        console.warn(responseBody.schema)
        // console.error(error)
      }
    }

    const desc = description || summary || pathName

    const itemRes: SwaggerJsonTreeItem & TreeInterface = {
      groupName: configItem.title,
      type: 'interface',
      key: randomId(`${desc}-xxxxxx`),
      basePath: configItem.basePath || swaggerJson.basePath || '',
      parentKey: '',
      method,
      params,
      response,
      title: desc,
      subTitle: path,
      path,
      pathName,
      fileName,
      savePath: configItem.savePath || config.extConfig.savePath,
      ...item,
    }

    if (tags && tags.length) {
      tags.forEach((tagStr: string) => {
        let tagIndex = tagsMap[tagStr]
        if (tagIndex === undefined) {
          tagIndex = tagsMap['未知分组']
          if (!tagIndex) {
            addTag({ name: '未知分组', description: '分组ID在TAG表中未找到 (无效 Tag)' })
            tagIndex = tagsMap['未知分组']
          }
        }
        const tagVal = res[tagIndex]
        itemRes.parentKey = tagVal.key

        if (res[tagIndex].children && Array.isArray(tagVal.children)) {
          tagVal.children?.push(itemRes)
        } else {
          tagVal.children = [itemRes]
        }
      })
    } else {
      res.push(itemRes)
    }

    // console.log(itemRes)
    // return itemRes
  }

  try {
    for (const path in paths) {
      const pathItem = paths[path]
      const pathItemKeys = Object.keys(pathItem)

      pathItemKeys.forEach((method) => {
        parseMethodItem(path, pathItem as any, method, pathItemKeys.length > 1)
      })
    }
  } catch (error) {
    log.error(error, true)
  }

  return res
}

// 递归获取 ref
function getSwaggerJsonRef(schema?: OpenAPIV2.SchemaObject, definitions?: OpenAPIV2.DefinitionsObject): any {
  const { items, originalRef } = schema || {}
  let { $ref } = schema || {}
  let refData: any = {}

  if (items) {
    const {
      // originalRef: itemOriginalRef,
      $ref: item$ref,
    } = items

    // if (itemOriginalRef) originalRef = itemOriginalRef
    if (item$ref) $ref = item$ref
  }

  let refPath = ''

  if (originalRef && definitions) {
    refPath = originalRef?.trim()
    refData = definitions[refPath]
  } else if ($ref) {
    refPath = $ref.trim().replace('#/definitions/', '').replace('/', '.')
    refData = getValueByPath(definitions, refPath)
  }

  if (!refData) {
    log.error(
      'getSwaggerJsonRef Error:' + JSON.stringify({ res: refData, originalRef, schema, refPath }, undefined, 2),
      true
    )
  }

  const propertiesList: TreeInterfacePropertiesItem[] = []
  const { properties, required = [] } = refData || {}

  if (properties) {
    for (const key in properties) {
      const val = properties[key]
      const obj: TreeInterfacePropertiesItem = {
        name: val.name || key,
        type: val.type,
        required: required && required.length && required.includes(key) ? true : false,
        description: val.description,
        titRef: val.title,
      }

      if ((val.originalRef && val.originalRef != originalRef) || (val.$ref && val.$ref != $ref)) {
        obj.item = getSwaggerJsonRef(val, definitions)
      }

      if (val.items) {
        let schema
        if (val.items.schema) {
          schema = val.items.schema
        } else if (val.items.originalRef || val.items.$ref) {
          schema = val.items
        } else if (val.items.type) {
          obj.itemsType = val.items.type
        } else if (val.originalRef || val.$ref) {
          schema = val
        }

        if (schema && (schema.originalRef != originalRef || schema.$ref != $ref)) {
          obj.item = getSwaggerJsonRef(schema, definitions)
        }
      }

      propertiesList.push(obj)
    }
  }

  return Object.assign({}, refData, {
    properties: propertiesList,
    item: propertiesList,
  })
}
