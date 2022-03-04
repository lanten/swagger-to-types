import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { TEMPLATE_FILE_NAME, DEFAULT_TEMPLATE_FILE_PATH, config, log, localize } from '../tools'

export function editTemplateGlobal() {
  const globalTemplatePath = path.join(config.getGlobalStoragePath(), TEMPLATE_FILE_NAME)

  if (!fs.existsSync(globalTemplatePath)) {
    const readable = fs.createReadStream(DEFAULT_TEMPLATE_FILE_PATH)
    const writable = fs.createWriteStream(globalTemplatePath)
    readable.pipe(writable)
    log.info(localize.getLocalize('text.success.create', globalTemplatePath))
  }

  vscode.workspace.openTextDocument(globalTemplatePath).then((doc) => {
    vscode.window.showTextDocument(doc)
  })
}

export function registerEditTemplateGlobal() {
  vscode.commands.registerCommand('cmd.editTemplateGlobal', editTemplateGlobal)
}
