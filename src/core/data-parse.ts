export function parseSwaggerJson(swaggerJson: SwaggerJson): SwaggerJsonTreeItem[] {
  const { tags, paths, definitions } = swaggerJson
  let res: SwaggerJsonTreeItem[] = []
  const tagsMap = {}
  if (tags && tags.length) {
    res = tags.map((v, i) => {
      tagsMap[v.name] = i
      return {
        title: v.name,
        subTitle: v.description,
        type: 'tag',
      }
    })
  }

  for (const path in paths) {
    const v = paths[path]
    const method = Object.keys(v)[0]
    const { summary, tags, parameters = [], responses = [], ...item } = v[method]

    let params: any[] = []
    if (!parameters || !parameters.length) {
      params = []
    } else if (method === 'post') {
      const paramsBody = parameters[0]
      const paramsSource = paramsBody.schema && getSwaggerJsonRef(paramsBody.schema, definitions)
      if (paramsSource && paramsSource.properties) {
        const { properties } = paramsSource
        for (const name in properties) {
          const val = properties[name]
          const obj = {
            ...val,
            name,
          }
          params.push(obj)
        }
      }
    } else {
      params = parameters
    }

    let response: any = {}

    if (parameters && parameters.length) {
      const responseBody = responses[200] || {}
      response = responseBody.schema && getSwaggerJsonRef(responseBody.schema, definitions)
    }

    const itemRes = {
      type: 'interface',
      method,
      params,
      response,
      title: summary,
      subTitle: path,
      path,
      ...item,
    }

    if (tags && tags.length) {
      tags.forEach(tagStr => {
        const resIndex = tagsMap[tagStr]
        if (res[resIndex].children && Array.isArray(res[resIndex].children)) {
          // @ts-ignore
          res[resIndex].children.push(itemRes)
        } else {
          res[resIndex].children = [itemRes]
        }
      })
    }
  }

  return res
}

// 递归获取 ref
export function getSwaggerJsonRef(
  schema: SwaggerJsonSchema,
  definitions: SwaggerJsonDefinitions
): SwaggerJsonDefinitionsItem {
  const { originalRef } = schema
  const ref = definitions[originalRef]
  const { properties, required = [] } = ref
  if (!properties) return ref
  for (const key in properties) {
    const val = properties[key]

    // @ts-ignore
    ref.properties[key].required = required && required.length && required.includes(key) ? true : false

    if (val.originalRef) {
      ref.properties[key] = getSwaggerJsonRef(val as SwaggerJsonSchema, definitions)
    }
    if (val.items) {
      // @ts-ignore
      ref.properties[key].items = getSwaggerJsonRef(val.items, definitions)
    }
  }
  return ref
}

export function parseToInterface(data: TreeInterface): string {
  const name = data.operationId
  const lines: string[] = [
    ...parseHeaderInfo(data),
    ...parseNameSpace(name, [...parseParams(data.params, 1), ...parseResponse(data.response, 1)]),
  ]

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
    ...content.map(v => `${indentationSpace}${v}`),
    `${indentationSpace}}`,
  ]
}

/**
 * 解析参数接口
 * @param params
 * @param indentation
 */
function parseParams(params: TreeInterfaceParamsItem[], indentation = 0): string[] {
  const indentationSpace = handleIndentation(indentation)
  const indentationSpace2 = handleIndentation(indentation + 1)
  return [
    `${indentationSpace}interface Params {`,
    ...params.map(v => {
      const description = v.description ? `${indentationSpace2}/** ${v.description} */\n` : ''
      return `${description}${indentationSpace2}${v.name}${v.required ? ':' : '?:'} ${handleType(v.type)}`
    }),
    `${indentationSpace}}`,
    '',
  ]
}

function parseResponse(response: { [key: string]: TreeInterfaceResponseItem }, indentation = 0): string[] {
  const indentationSpace = handleIndentation(indentation)
  const indentationSpace2 = handleIndentation(indentation + 1)

  const content = []

  console.log(response)
  for (const name in response) {
    const v = response[name]
    if (v.description) content.push(`${indentationSpace2}/** ${v.description} */`)
    content.push(`${indentationSpace2}${name}${v.required ? ':' : '?:'} ${handleType(v.type)}`)
  }
  return [`${indentationSpace}interface Response {`, ...content, `${indentationSpace}}`, '']
}

/**
 * 解析头部信息
 * @param data
 */
function parseHeaderInfo(data: TreeInterface): string[] {
  return [
    '/**',
    ` * name   : ${data.title}`,
    ` * path   : ${data.path}`,
    ` * method : ${data.method}`,
    ` * update : ${new Date().toLocaleString()}`,
    ' */',
    '',
  ]
}

/**
 * 处理缩进层级
 * @param indentation
 */
function handleIndentation(indentation = 0): string {
  return new Array(indentation * $ext.BASE_INDENTATION_COUNT + 1).join($ext.BASE_INDENTATION)
}

/**
 * 处理数据类型
 * @param type
 */
function handleType(type: string): string {
  switch (type) {
    case 'integer':
      return 'number'

    default:
      return type
  }
}
