declare namespace $ext {
  const WORKSPACE_PATH: string | undefined
  const EXT_NAME: string
  const EXT_PATH: string

  namespace config {
    /** 插件配置 */
    const extConfig: ExtConfig
    /** 获取工作区配置 */
    function getWorkspaceConfig(): WorkspaceConfig
    /** 写入工作区配置 */
    function setWorkspaceConfig(config: WorkspaceConfig): void
    /** 获取插件目录下的配置 */
    function getLocalConfig(): LocalConfig
    /** 写入插件目录下的配置 */
    function setLocalConfig(config: LocalConfig): void
  }

  namespace localize {
    function getLocalize(key: string, ...params: string[]): string
  }

  /** vscode 日志 */
  namespace log {
    /** 普通日志 */
    function log(message: string, intend?: number): void
    /** 信息日志 */
    function info(message: string, intend?: number): void
    /** 警告日志 */
    function warn(message: string, intend?: number): void
    /** 成功日志 */
    function success(message: string, intend?: number): void
    /** 错误日志 */
    function error(err: Error | string, prompt?: boolean, intend?: number): void
  }
}

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
