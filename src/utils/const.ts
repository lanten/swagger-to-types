import vscode from 'vscode'
import packageJson from '../../package.json'
import path from 'path'

const { workspaceFolders } = vscode.workspace

export const WORKSPACE_PATH = workspaceFolders ? workspaceFolders[0].uri.fsPath.replace(/\\/g, '/') : undefined

export const EXT_NAME = packageJson.name

export const EXT_PATH = path.join(__dirname, '../')

export const LOCAL_CONFIG_PATH = path.join(EXT_PATH, 'local.config.json')
