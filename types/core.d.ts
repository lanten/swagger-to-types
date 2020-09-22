interface SwaggerJson {
  swagger: string
  host: string
  basePath: string
  info: {
    description: string
    version: string
    title: string
    contact: any
  }
  tags?: SwaggerJsonTagsItem[]
  paths: {
    [key: string]: {
      [key: string]: {
        tags?: string[]
        summary: string
        operationId: string
        description: string
        consumes: string[]
        produces: string[]
        parameters?: {
          name: string
          in: string
          description: string
          required: boolean
          type?: string
          schema?: SwaggerJsonSchema
        }[]
        responses: {
          [key: string]: {
            description: string
            schema?: SwaggerJsonSchema
          }
        }
        deprecated: boolean
      }
    }
  }
  definitions: SwaggerJsonDefinitions
}

interface SwaggerJsonDefinitions {
  [key: string]: SwaggerJsonDefinitionsItem
}

interface SwaggerJsonDefinitionsItem {
  type: string
  required?: string[]
  properties: any
  title: string
  item?: any
}

interface SwaggerJsonTagsItem {
  name: string
  description: string
}

interface SwaggerJsonSchema {
  originalRef: string
  $ref: string
}

interface SwaggerJsonTreeItem {
  type:
    | 'root' // 根节点
    | 'group' // 接口分组
    | 'interface' // 接口节点
  title: string
  subTitle: string
  pathName?: string
  fileName?: string
  method?: string

  children?: any[]
}

interface TreeInterfaceParamsItem {
  name: string
  in?: string
  description: string
  required: boolean
  type: string
}

interface TreeInterfacePropertiesItem {
  name: string
  description?: string
  required: boolean
  type: string
  properties?: TreeInterfacePropertiesItem
  item?: TreeInterfacePropertiesItem[]
  title?: string
  titRef?: string
  itemsType?: string
}

interface TreeInterface {
  type: string
  method: 'get' | 'post'
  params: TreeInterfaceParamsItem[]
  response: TreeInterfacePropertiesItem
  title: string
  path: string
  subTitle: string
  pathName: string
  fileName: string
  operationId: string
  produces: string[]
  deprecated: boolean
}
