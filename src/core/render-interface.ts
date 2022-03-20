import { BASE_INDENTATION, BASE_INDENTATION_COUNT } from '../tools'

/**
 * 渲染 Typescript Interface
 * @param data
 * @returns
 */
export function renderToInterface(data: TreeInterface): string {
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
function parseParams(
  params: TreeInterfaceParamsItem[] | TreeInterfacePropertiesItem | string,
  indentation = 0
): string[] {
  const res = parseProperties('Params', params, indentation)
  // res.pop() // 删除多余空行
  return res
}

/**
 * 解析返回结果
 * @param response
 * @param indentation
 */
function parseResponse(
  response: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string,
  indentation = 0
): string[] {
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
  const indentationSpace = handleIndentation(indentation) // 一级缩进
  const indentationSpace2 = handleIndentation(indentation + 1) // 二级缩进
  const interfaceList = []
  let content: string[] = []

  if (Array.isArray(properties)) {
    if (properties.length === 1 && properties[0].name === '____body_root_param____') {
      let type = properties[0].type
      if (type === 'array') {
        type = `${type === 'array' ? handleType(properties[0].items?.type) : type}[]`
      }

      const description: string = properties[0].description
        ? `${indentationSpace}/** ${properties[0].description} */\n`
        : ''

      interfaceList.push(`${description}${indentationSpace}type ${interfaceName} = ${type}`, '')
      return interfaceList
    }

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

      if (v.enum) {
        type = parseEnumToUnionType(v.enum)
      } else if (v.items?.enum) {
        type = parseEnumToUnionType(v.items.enum)
      }

      if (v.type === 'array') {
        if ((v.enum || v.items?.enum) && type !== 'any') {
          type = `(${type})`
        }
        type = `${type === 'array' ? handleType(v.itemsType || 'any') : type}[]`
      }

      let defaultValDesc = v.default || v.items?.default || ''
      if (typeof defaultValDesc === 'object') {
        defaultValDesc = JSON.stringify(defaultValDesc)
      }
      if (defaultValDesc) {
        defaultValDesc = `[default:${defaultValDesc}]`
      }

      let description: string = v.description || ''
      if (defaultValDesc) {
        description = description ? `${description} -- ${defaultValDesc}` : defaultValDesc
      }
      if (description) {
        description = `${indentationSpace2}/** ${description} */\n`
      }

      return `${description}${indentationSpace2}${v.name}${v.required ? ':' : '?:'} ${type}`
    })
  } else if (typeof properties === 'object') {
    let arr: TreeInterfacePropertiesItem[] = []

    if (properties.properties && Array.isArray(properties.properties)) arr = properties.properties
    if (properties.item && Array.isArray(properties.item)) arr = properties.item
    if (arr.length) {
      interfaceList.push(...parseProperties(`${interfaceName}${toUp(properties.name)}`, arr, indentation))
    }
  } else if (typeof properties === 'string') {
    interfaceList.push(`${indentationSpace}type ${interfaceName} = ${handleType(properties)}`, '')
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
  const lines = [
    '/**',
    ` * @name     ${data.title || ''} (${data.groupName})`,
    ` * @base     ${data.basePath || ''}`,
    ` * @path     ${data.path}`,
    ` * @method   ${data.method.toUpperCase()}`,
    ` * @update   ${new Date().toLocaleString()}`,
    ' */',
    '',
  ]

  if (data.savePath) {
    lines.splice(5, 0, ` * @savePath ${data.savePath}`)
  }

  return lines
  // data.savePath ? ` * @savePath   ${data.savePath}` : undefined,
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
 * 将枚举类型解析为联合
 * @param name
 * @param enumArr
 * @param indentation
 * @returns
 */
function parseEnumToUnionType(enumArr?: string[]): string {
  if (!enumArr || !enumArr.length) return 'any'
  return `${enumArr.map((v) => `'${v}'`).join(' | ')}`
}

/**
 * 删除多余空行
 * @param arr
 * @returns
 */
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
