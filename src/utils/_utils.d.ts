import * as ext from './'

type Ext = typeof ext

declare global {
  const $ext: Ext

  interface WorkspaceConfig {
    savePath?: string
    swaggerJsonUrl?: SwaggerJsonUrlItem[]
  }

  interface SwaggerJsonUrlItem {
    title: string
    url: string
  }

  interface ExtConfig extends WorkspaceConfig, LocalConfig {}

  interface LocalConfig {
    activeGroupIndex?: number
  }
}

// declare namespace $ext {
//   /** 工作区路径 */
//   const WORKSPACE_PATH: string | undefined
//   /** 插件名称 */
//   const EXT_NAME: string
//   /** 插件私有配置文件路径 */
//   const LOCAL_CONFIG_PATH: string
//   /** 插件本体路径 */
//   const EXT_PATH: string
//   /** 默认缩进单位 */
//   const BASE_INDENTATION: string
//   /** 默认缩进宽度 */
//   const BASE_INDENTATION_COUNT: number

//   namespace config {
//     /** 插件配置 */
//     const extConfig: ExtConfig
//     /** 获取工作区配置 */
//     function getWorkspaceConfig(): WorkspaceConfig
//     /** 写入工作区配置 */
//     function setWorkspaceConfig(config: WorkspaceConfig): void
//     /** 获取插件目录下的配置 */
//     function getLocalConfig(): LocalConfig
//     /** 写入插件目录下的配置 */
//     function setLocalConfig(config: LocalConfig): void
//   }

//   namespace localize {
//     function getLocalize(key: string, ...params: string[]): string
//   }

//   /** vscode 日志 */
//   namespace log {
//     /** 普通日志 */
//     function log(message: string, intend?: number): void
//     /** 信息日志 */
//     function info(message: string, intend?: number): void
//     /** 警告日志 */
//     function warn(message: string, intend?: number): void
//     /** 成功日志 */
//     function success(message: string, intend?: number): void
//     /** 错误日志 */
//     function error(err: Error | string, prompt?: boolean, intend?: number): void
//   }

//   /**
//    * 递归创建路径
//    * @param dir
//    * @param inputPath
//    * @param split
//    */
//   function mkdirRecursive(dir: string, inputPath?: string, split?: string): void

//   /**
//    * 打开一个未保存的文档
//    * @param docStr
//    * @param name
//    */
//   function preSaveDocument(docStr: string, name: string): Thenable<boolean>
// }
