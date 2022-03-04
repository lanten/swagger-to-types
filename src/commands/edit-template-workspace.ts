import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH, TEMPLATE_FILE_NAME, DEFAULT_TEMPLATE_FILE_PATH, mkdirRecursive, log, localize } from '../tools'

export function editTemplateWorkspace() {
  const vscodeConfigFolderPath = path.join(WORKSPACE_PATH || '', '.vscode')
  const workspaceConfigPath = path.join(vscodeConfigFolderPath, TEMPLATE_FILE_NAME)

  if (!fs.existsSync(vscodeConfigFolderPath)) {
    try {
      mkdirRecursive('.vscode')
    } catch (error) {
      return log.error(localize.getLocalize('text.error.create.folders', vscodeConfigFolderPath))
    }
  }

  if (!fs.existsSync(workspaceConfigPath)) {
    const readable = fs.createReadStream(DEFAULT_TEMPLATE_FILE_PATH)
    const writable = fs.createWriteStream(workspaceConfigPath)
    readable.pipe(writable)
    log.info(localize.getLocalize('text.success.create', workspaceConfigPath))
  }

  vscode.workspace.openTextDocument(workspaceConfigPath).then((doc) => {
    vscode.window.showTextDocument(doc)
  })
}

export function registerEditTemplateWorkspace() {
  vscode.commands.registerCommand('cmd.editTemplateWorkspace', editTemplateWorkspace)
}
