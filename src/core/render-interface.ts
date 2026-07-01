import { BASE_INDENTATION, BASE_INDENTATION_COUNT, templateConfig } from '../tools'

/**
 * 渲染 Typescript Interface
 * @param data
 * @returns
 */
export function renderToInterface(data: TreeInterface): string {
  // const name = data.operationId.replace('_', '')
  // const name = data.pathName

  // ref → 已生成的 interface 名映射，用于将循环引用回指已存在的 interface
  const refMap = new Map<string, string>()

  const paramsArr = removeEmptyLines(parseParams(data, 1, refMap))
  const resArr = removeEmptyLines(parseResponse(data, 1, refMap))

  let content = paramsArr
  if (content.length) content.push('')
  content = content.concat(resArr)

  const lines: string[] = [...parseHeaderInfo(data), ...parseNameSpace(data, content), '']

  return lines.join('\n')
}

/**
 * 解析命名空间
 * @param name
 * @param content
 * @param indentation
 */
function parseNameSpace(item: TreeInterface, content: string[], indentation = 0): string[] {
  const indentationSpace = handleIndentation(indentation)

  const nameH = templateConfig.namespace ? templateConfig.namespace(item) : item.pathName

  return [
    `${indentationSpace}declare namespace ${nameH} {`,
    ...content.map((v) => `${indentationSpace}${v}`),
    `${indentationSpace}}`,
  ]
}

/** 解析参数接口 */
function parseParams(data: TreeInterface, indentation = 0, refMap: Map<string, string> = new Map()): string[] {
  const res = parseProperties(
    'Params',
    templateConfig?.params?.(data),
    Object.assign(data),
    data.params,
    indentation,
    refMap
  )
  // res.pop() // 删除多余空行
  return res
}

/** 解析返回结果 */
function parseResponse(data: TreeInterface, indentation = 0, refMap: Map<string, string> = new Map()): string[] {
  const res = parseProperties(
    'Response',
    templateConfig?.response?.(data),
    Object.assign(data),
    data.response,
    indentation,
    refMap
  )
  // res.pop() // 删除多余空行
  return res
}

/** 解析详细属性 */
function parseProperties(
  interfaceType: 'Params' | 'Response',
  interfaceName: string | undefined,
  data: TreeInterface,
  properties: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string | undefined,
  indentation = 0,
  refMap: Map<string, string> = new Map()
): string[] {
  const indentationSpace = handleIndentation(indentation) // 一级缩进
  const indentationSpace2 = handleIndentation(indentation + 1) // 二级缩进
  const interfaceList = []
  let content: string[] = []

  if (!interfaceName) interfaceName = interfaceType

  if (Array.isArray(properties)) {
    if (properties.length === 1 && properties[0].name === '____body_root_param____') {
      let type = properties[0].type
      if (type === 'array') {
        type = parseArrayType(properties[0], type)
      }

      const description: string = properties[0].description
        ? `${indentationSpace}/** ${properties[0].description} */\n`
        : ''

      interfaceList.push(`${description}${indentationSpace}type ${interfaceName} = ${type}`, '')
      return interfaceList
    }

    content = properties.map((v) => {
      let type = handleType(v.type)

      // 循环引用：直接复用已注册的 interface 名
      const cyclicName = v.cyclicRef ? refMap.get(v.cyclicRef) : undefined

      if (cyclicName) {
        type = cyclicName
      } else if (v.item) {
        type = `${interfaceName}${toUp(v.name)}`
        if (v.type === 'array') type = `${type}Item`

        // 注册当前 ref → 即将生成的 interface 名（首登记优先，确保循环点能回指到此名）
        if (v.ref && !refMap.has(v.ref)) refMap.set(v.ref, type)

        interfaceList.push(...parseProperties(interfaceType, type, data, v.item, indentation, refMap))
      }

      try {
        // @ts-ignore
        if (!cyclicName && !v.item.properties.length) type = 'Record<string, unknown>'
      } catch (error) {
        // console.warn(error)
      }

      if (v.enum) {
        type = parseEnumToUnionType(v.enum)
      } else if (v.items?.enum) {
        type = parseEnumToUnionType(v.items.enum)
      }

      if (v.type === 'array') {
        type = parseArrayType(v, type)
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

      let keyValue = `${v.name}${v.required ? ':' : '?:'} ${type}`

      if (interfaceType === 'Params' && templateConfig.paramsItem) {
        const res = templateConfig.paramsItem(Object.assign({}, v, { type }), data)
        if (res) keyValue = res
      } else if (interfaceType === 'Response' && templateConfig.responseItem) {
        const res = templateConfig.responseItem(Object.assign({}, v, { type }), data)
        if (res) keyValue = res
      }

      return `${description}${indentationSpace2}${keyValue}`
    })
  } else if (typeof properties === 'object') {
    let arr: TreeInterfacePropertiesItem[] = []

    if (properties.properties && Array.isArray(properties.properties)) arr = properties.properties
    if (properties.item && Array.isArray(properties.item)) arr = properties.item
    if (arr.length) {
      // 根 interface 不注册 ref，让首个由字段路径派生出的子 interface 名作为该 ref 的标准回指目标
      interfaceList.push(
        ...parseProperties(interfaceType, `${interfaceName}${toUp(properties.name)}`, data, arr, indentation, refMap)
      )
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
    ` * @savePath ${data.savePath}`,
    ` * @update   ${new Date().toLocaleString()}`,
    ' */',
    '',
  ]

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
      return 'any'

    default:
      return type || 'any'
  }
}

/** 解析数组类型，保留 string[][] 这类多维数组结构 */
function parseArrayType(item: TreeInterfacePropertiesItem, currentType: string): string {
  let type = currentType
  if (type === 'array') {
    type = getArrayLeafType(item)
  }

  if ((item.enum || item.items?.enum) && type !== 'any') {
    type = `(${type})`
  }

  return `${type}${'[]'.repeat(getArrayDepth(item))}`
}

/** 获取数组维度；旧数据没有 arrayDepth 时从 items 兜底推断 */
function getArrayDepth(item: TreeInterfacePropertiesItem): number {
  if (item.arrayDepth && item.arrayDepth > 0) return item.arrayDepth

  let depth = 1
  let items = item.items
  while (items?.type === 'array' && items.items) {
    depth += 1
    items = items.items
  }

  return depth
}

/** 获取多维数组最终叶子类型 */
function getArrayLeafType(item: TreeInterfacePropertiesItem): string {
  if (item.itemsType && item.itemsType !== 'array') return handleType(item.itemsType)

  let items = item.items
  while (items?.type === 'array' && items.items) {
    items = items.items
  }

  return handleType(items?.type && items.type !== 'array' ? items.type : item.itemsType || 'any')
}

/**
 * 将枚举类型解析为元组
 * @param name
 * @param enumArr
 * @param indentation
 * @returns
 */
function parseEnumToUnionType(enumArr?: string[]): string {
  if (!enumArr || !enumArr.length) return 'any'
  return `${enumArr
    .map((v) => {
      return typeof v === 'string' ? `'${v}'` : `${v}`
    })
    .join(' | ')}`
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
