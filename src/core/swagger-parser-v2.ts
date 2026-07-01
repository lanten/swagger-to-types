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

  const tagsMap: any = {}
  if (tags && tags.length) {
    tags.forEach((v: any) => {
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
    const { summary, description, tags, parameters = [], responses = {}, ...item } = (pathItem as any)[method]
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

    const desc = summary || description || pathName

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

// 提取 schema/val 携带的 ref 名（originalRef 优先，其次 $ref）
function resolveRefName(v: any): string | undefined {
  if (!v) return undefined
  if (v.originalRef) return String(v.originalRef).trim()
  if (v.$ref) return String(v.$ref).trim().replace('#/definitions/', '').replace('/', '.')
  return undefined
}

function getArrayItemsInfo(items: any): { depth: number; schema: any } {
  let depth = 1
  let schema = items?.schema || items

  while (schema?.type === 'array' && schema.items) {
    depth += 1
    schema = schema.items.schema || schema.items
  }

  return { depth, schema }
}

// 递归获取 ref（parentRefs 沿调用栈累积已访问过的 ref，防止任意层级的循环引用）
function getSwaggerJsonRef(
  schema?: OpenAPIV2.SchemaObject,
  definitions?: OpenAPIV2.DefinitionsObject,
  parentRefs: Set<string> = new Set()
): any {
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

      // Part 1: 属性自身是 ref（直接对象类型）
      const directRef = resolveRefName(val)
      if (directRef) {
        if (parentRefs.has(directRef)) {
          obj.cyclicRef = directRef
        } else {
          obj.ref = directRef
          obj.item = getSwaggerJsonRef(val, definitions, new Set(parentRefs).add(directRef))
        }
      }

      // Part 2: 属性为数组，items 可能是 ref
      if (val.items) {
        const arrayItemsInfo = getArrayItemsInfo(val.items)
        let itemsSchema: any
        obj.arrayDepth = arrayItemsInfo.depth
        obj.items = arrayItemsInfo.schema

        if (arrayItemsInfo.schema?.originalRef || arrayItemsInfo.schema?.$ref) {
          itemsSchema = arrayItemsInfo.schema
        } else if (arrayItemsInfo.schema?.type) {
          obj.itemsType = arrayItemsInfo.schema.type
        } else if (val.originalRef || val.$ref) {
          itemsSchema = val
        }

        const itemsRef = resolveRefName(itemsSchema)
        if (itemsRef) {
          if (parentRefs.has(itemsRef)) {
            obj.cyclicRef = itemsRef
            delete obj.item
            delete obj.ref
          } else {
            obj.ref = itemsRef
            obj.item = getSwaggerJsonRef(itemsSchema, definitions, new Set(parentRefs).add(itemsRef))
          }
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
