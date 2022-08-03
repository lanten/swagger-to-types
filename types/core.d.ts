import { OpenAPIV3 } from 'openapi-types'

declare global {
  interface ParametersItems {
    default?: string
    enum?: string[]
    type: string
  }

  interface SwaggerJsonTreeItem extends Partial<TreeInterface> {
    key: string
    parentKey: string
    type:
      | 'root' // 根节点
      | 'group' // 接口分组
      | 'interface' // 接口节点
      | 'file-sync' // 本地文件
      | 'file-ignore' // 本地文件
    title: string
    subTitle: string
    savePath?: string
    // pathName?: string
    // fileName?: string
    // method?: string
    children?: any[]
  }

  interface TreeInterfaceParamsItem {
    name: string
    in?: string
    description?: string
    required?: boolean
    type?: string
  }

  type TreeInterfacePropertiesItem = {
    name: string
    description?: string
    required?: boolean
    type?: string
    enum?: string[]
    itemsRequiredNamesList?: string[]
    properties?: Partial<TreeInterfacePropertiesItem>
    /** 子类型 */
    item?: TreeInterfacePropertiesItem[] | string
    /** 子类型-联合 */
    itemUnion?: Required<TreeInterfacePropertiesItem['item']>[]
    title?: string
    titRef?: string
    itemsType?: string
    default?: any
    items?: ParametersItems
  }

  interface TreeInterface {
    type: string
    basePath: string
    groupName: string
    method: string
    params: TreeInterfaceParamsItem[] | TreeInterfacePropertiesItem
    response: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string
    title: string
    path: string
    subTitle: string
    pathName: string
    fileName: string
    operationId: string
    savePath: string
    // produces: string[]
    // deprecated: boolean
  }

  interface FileHeaderInfo {
    /** 文件名 */
    fileName: string
    /** 扩展名 */
    ext: string
    /** 文件路径 */
    filePath: string
    /** 接口名称 */
    name?: string
    /** namespace */
    namespace?: string
    /** 接口地址 */
    path?: string
    /** 请求方法 */
    method?: string
    /** 更新时间 */
    update?: string
    /** 忽略自动更新 */
    ignore?: boolean
    /** 接口保存目录 */
    savePath?: string
  }
}
