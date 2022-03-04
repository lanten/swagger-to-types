import vscode from 'vscode'
import packageJson from '../../package.json'
import path from 'path'

const { workspaceFolders } = vscode.workspace
/** 工作区路径 */
export const WORKSPACE_PATH = workspaceFolders ? workspaceFolders[0].uri.fsPath.replace(/\\/g, '/') : undefined

/** 插件设置 */
export const CONFIG_LIST = <const>[
  'swaggerJsonUrl',
  'savePath',
  'compareChanges',
  'showStatusbarItem',
  'reloadWhenSettingsChanged',
]
export type ExtConfigItem = typeof CONFIG_LIST[number]

/** 插件名称 */
export const EXT_NAME = packageJson.name
/** 插件本体路径 */
export const EXT_PATH = path.join(__dirname, '../../../')
/** 插件发布者 */
export const PUBLISHER = packageJson.publisher
/** 插件私有配置文件路径 */
export const LOCAL_CONFIG_PATH = path.join(EXT_PATH, 'local.config.json')
/** vscode 配置项前缀 */
export const CONFIG_GROUP = 'swaggerToTypes'
/** 模板配置文件名 */
export const TEMPLATE_FILE_NAME = 'swagger-to-types.template.js'
/** 默认模板配置文件路径 */
export const DEFAULT_TEMPLATE_FILE_PATH = path.join(EXT_PATH, 'templates/new.template.js')

/** 默认缩进单位 */
export const BASE_INDENTATION = ' '
/** 默认缩进宽度 */
export const BASE_INDENTATION_COUNT = 2
