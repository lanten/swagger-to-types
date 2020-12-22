import {
  toCamel,
  log,
  BASE_INDENTATION,
  BASE_INDENTATION_COUNT,
  randomId,
  SwaggerJsonUrlItem,
  getValueByPath,
} from '../tools'

export function parseSwaggerJson(swaggerJson: SwaggerJson, configItem: SwaggerJsonUrlItem): SwaggerJsonTreeItem[] {
  const { tags, paths, definitions } = swaggerJson
  let res: SwaggerJsonTreeItem[] = []

  console.log(swaggerJson)

  const tagsMap = {}
  if (tags && tags.length) {
    res = tags.map((v, i) => {
      tagsMap[v.name] = i
      return {
        key: randomId(`${v.name}-xxxxxx`),
        parentKey: configItem.url,
        title: v.name,
        subTitle: v.description,
        type: 'group',
      }
    })
  }

  for (const path in paths) {
    const v = paths[path]
    const method = Object.keys(v)[0]
    const { summary, tags, parameters = [], responses = {}, ...item } = v[method]
    const pathName = toCamel(path, false, '/')
      .replace('/', '')
      .replace(/[\[\]<>(){|}]/g, '$')
    const fileName = path.slice(1, path.length).replace(/\//g, '-')

    let params: any[] = []
    if (!parameters || !parameters.length) {
      params = []
    } else {
      const bodyIndex = parameters.findIndex((x) => x.in === 'body')

      if (bodyIndex !== -1) {
        const paramsBody = parameters[bodyIndex]
        const paramsSource = paramsBody.schema && getSwaggerJsonRef(paramsBody.schema, definitions)
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
        params = parameters.filter((x) => x.in !== 'header')
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

    const itemRes: SwaggerJsonTreeItem & TreeInterface = {
      groupName: configItem.title,
      type: 'interface',
      key: randomId(`${summary}-xxxxxx`),
      basePath: configItem.basePath || swaggerJson.basePath,
      parentKey: '',
      method,
      params,
      response,
      title: summary,
      subTitle: path,
      path,
      pathName,
      fileName,
      ...item,
    }

    if (tags && tags.length) {
      tags.forEach((tagStr) => {
        const tagIndex = tagsMap[tagStr]
        const tagVal = res[tagIndex]
        itemRes.parentKey = tagVal.key

        if (res[tagIndex].children && Array.isArray(tagVal.children)) {
          tagVal.children?.push(itemRes)
        } else {
          tagVal.children = [itemRes]
        }
      })
    }
  }

  console.log(res)

  return res
}

// 递归获取 ref
export function getSwaggerJsonRef(schema?: SwaggerJsonSchema, definitions?: SwaggerJsonDefinitions): any {
  const { items } = schema || {}
  let { originalRef, $ref } = schema || {}
  let refData: any = {}

  if (items) {
    const { originalRef: itemOriginalRef, $ref: item$ref } = items

    if (itemOriginalRef) originalRef = itemOriginalRef
    if (item$ref) $ref = item$ref
  }

  if (originalRef && definitions) {
    refData = definitions[originalRef]
  } else if ($ref) {
    const refPath = $ref.replace('#/definitions/', '').replace('/', '.')
    refData = getValueByPath(definitions, refPath)
  }

  if (!refData) {
    log.error(JSON.stringify({ res: refData, originalRef }, undefined, 2), true)
  }

  const propertiesList: TreeInterfacePropertiesItem[] = []
  const { properties, required = [] } = refData

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
        obj.item = getSwaggerJsonRef(val as SwaggerJsonSchema, definitions)
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

/** 删除多余空行 */
function removeEmptyLines(arr: string[]): string[] {
  if (arr[0] === '') {
    arr.shift()
    if (arr[0] === '') return removeEmptyLines(arr)
  }

  if (arr[arr.length - 1] === '') {
    arr.pop()
    if (arr[arr.length - 1] === '') return removeEmptyLines(arr)
  }

  return arr
}

export function parseToInterface(data: TreeInterface): string {
  // const name = data.operationId.replace('_', '')
  const name = data.pathName

  const paramsArr = removeEmptyLines(parseParams(data.params, 1))
  const resArr = removeEmptyLines(parseResponse(data.response, 1))

  let content = paramsArr
  if (content.length) content.push('')
  content = content.concat(resArr)

  const lines: string[] = [...parseHeaderInfo(data), ...parseNameSpace(name, content), '']

  return lines.join('\n')
}

/**
 * 解析命名空间
 * @param name
 * @param content
 * @param indentation
 */
function parseNameSpace(name: string, content: string[], indentation = 0): string[] {
  const indentationSpace = handleIndentation(indentation)
  return [
    `${indentationSpace}declare namespace ${name} {`,
    ...content.map((v) => `${indentationSpace}${v}`),
    `${indentationSpace}}`,
  ]
}

/**
 * 解析参数接口
 * @param params
 * @param indentation
 */
function parseParams(params: TreeInterfaceParamsItem[], indentation = 0): string[] {
  const res = parseProperties('Params', params, indentation)
  // res.pop() // 删除多余空行
  return res
}

/**
 * 解析返回结果
 * @param response
 * @param indentation
 */
function parseResponse(response: TreeInterfacePropertiesItem, indentation = 0): string[] {
  const res = parseProperties('Response', response, indentation)
  // res.pop() // 删除多余空行
  return res
}

/**
 * 解析详细属性
 * @param properties
 * @param indentation
 */
function parseProperties(
  interfaceName: string,
  properties: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | undefined,
  indentation = 0
): string[] {
  const indentationSpace = handleIndentation(indentation)
  const indentationSpace2 = handleIndentation(indentation + 1)
  const interfaceList = []
  let content: string[] = []

  if (Array.isArray(properties)) {
    content = properties.map((v) => {
      let type = handleType(v.type)
      if (v.item) {
        type = `${interfaceName}${toUp(v.name)}`
        if (v.type === 'array') type = `${type}Item`
        interfaceList.push(...parseProperties(type, v.item, indentation))
      }

      try {
        // @ts-ignore
        if (!v.item.properties.length) type = 'Record<string, unknown>'
      } catch (error) {
        // console.warn(error)
      }

      if (v.type === 'array') {
        type = `${type === 'array' ? (v.items ? handleEnumType(v.items) : handleType(v.itemsType || 'any')) : type}[]`
      }

      const defaultValDesc = v.items?.default ? ` [default:${v.items.default}]` : ''

      const description = v.description ? `${indentationSpace2}/** ${v.description}${defaultValDesc} */\n` : ''
      return `${description}${indentationSpace2}${v.name}${v.required ? ':' : '?:'} ${type}`
    })
  } else if (properties) {
    let arr: TreeInterfacePropertiesItem[] = []

    if (properties.properties && Array.isArray(properties.properties)) arr = properties.properties
    if (properties.item && Array.isArray(properties.item)) arr = properties.item
    if (arr.length) {
      interfaceList.push(...parseProperties(`${interfaceName}${toUp(properties.name)}`, arr, indentation))
    }
  }

  if (content.length) {
    interfaceList.push(`${indentationSpace}interface ${interfaceName} {`, ...content, `${indentationSpace}}`, '')
  }

  return interfaceList
}

/**
 * 解析头部信息
 * @param data
 */
function parseHeaderInfo(data: TreeInterface): string[] {
  return [
    '/**',
    ` * @name   ${data.title} (${data.groupName})`,
    ` * @base   ${data.basePath}`,
    ` * @path   ${data.path}`,
    ` * @method ${data.method.toUpperCase()}`,
    ` * @update ${new Date().toLocaleString()}`,
    ' */',
    '',
  ]
}

/**
 * 处理缩进层级
 * @param indentation
 */
function handleIndentation(indentation = 0): string {
  return new Array(indentation * BASE_INDENTATION_COUNT + 1).join(BASE_INDENTATION)
}

/**
 * 首字母大写
 * @param {String} str
 */
function toUp(str: string) {
  if (typeof str !== 'string') return ''
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

/**
 * 处理数据类型
 * @param type
 */
function handleType(type: string): string {
  switch (type) {
    case 'integer':
      return 'number'

    case 'file':
      return 'File'

    case 'ref':
      return 'any // BUG: Type Error (ref)'

    case 'object':
      return 'Record<string, unknown>'

    default:
      return type || 'any'
  }
}

/**
 * 处理枚举类型
 */
function handleEnumType(items?: ParametersItems): string {
  if (!items || !items.enum) return 'any'

  const enumH = items.type === 'string' ? items.enum.map((v) => `'${v}'`) : items.enum
  return `(${enumH.join(' | ')})`
}
