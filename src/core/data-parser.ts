import { OpenAPIV3 } from 'openapi-types'
import { BASE_INDENTATION, BASE_INDENTATION_COUNT, randomId, SwaggerJsonUrlItem, toCamel } from '../tools'

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

    console.log(swaggerJson, configItem)
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

    this.result.push(tagItem)
  }

  /** 添加分组内元素 */
  pushGroupItem(tags: string[], itemRes: SwaggerJsonTreeItem) {
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
function parseResponse(response: TreeInterfacePropertiesItem | string, indentation = 0): string[] {
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
  properties: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string | undefined,
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
  } else if (typeof properties === 'object') {
    let arr: TreeInterfacePropertiesItem[] = []

    if (properties.properties && Array.isArray(properties.properties)) arr = properties.properties
    if (properties.item && Array.isArray(properties.item)) arr = properties.item
    if (arr.length) {
      interfaceList.push(...parseProperties(`${interfaceName}${toUp(properties.name)}`, arr, indentation))
    }
  }

  if (typeof properties === 'string') {
    interfaceList.push(`${indentationSpace}type ${interfaceName} = ${handleType(properties)}`, '')
  } else if (content.length) {
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
    ` * @name   ${data.title || ''} (${data.groupName})`,
    ` * @base   ${data.basePath || ''}`,
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
export function handleType(type?: string): string {
  switch (type) {
    case 'integer':
      return 'number'

    case 'file':
      return 'File'

    case 'ref':
      return 'any // BUG: Type Error (ref)'

    case 'object':
      return 'Record<string, any>'

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
