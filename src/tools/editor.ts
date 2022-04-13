import fs from 'fs'
import vscode from 'vscode'

import { log, localize, WORKSPACE_PATH, config, templateConfig } from '.'

class SwaggerInterfaceProvider implements vscode.TextDocumentContentProvider {
  static scheme = 'swagger-interface-provider'
  public doc = ''

  provideTextDocumentContent(): string {
    return this.doc
  }
}

/**
 * 打开一个未保存的文档
 * @param docStr
 * @param name
 * @param refresh 文档强刷
 */
export async function preSaveDocument(docStr: string, filePath: string, refresh?: boolean) {
  const newFile = vscode.Uri.parse(
    (fs.existsSync(filePath) ? 'file' : SwaggerInterfaceProvider.scheme) + ':' + filePath
  )

  const doc = await vscode.workspace.openTextDocument(newFile)

  if (refresh) {
    const edit = new vscode.WorkspaceEdit()
    const pMin = new vscode.Position(0, 0)
    const pMax = new vscode.Position(999999999, 999999999)
    edit.replace(newFile, new vscode.Range(pMin, pMax), docStr)

    return vscode.workspace.applyEdit(edit).then((success) => {
      if (success) {
        vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Active })
      } else {
        log.error('open document error error!', true)
      }
      return success
    })
  } else {
    vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Active })
  }
}

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = []
  HEADER_RANGE = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))

  public provideCodeLenses(doc: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    this.codeLenses = []

    this.codeLenses.push(
      new vscode.CodeLens(this.HEADER_RANGE, {
        title: localize.getLocalize('text.preview'),
        command: '',
      })
    )

    this.codeLenses.push(
      new vscode.CodeLens(this.HEADER_RANGE, {
        title: `${localize.getLocalize('text.clickToSave')}`,
        command: 'cmd.list.saveInterfaceWitchDoc',
        arguments: [doc],
      })
    )

    return this.codeLenses
  }
}

export class CodelensProviderLocal implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = []
  HEADER_RANGE = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))

  public provideCodeLenses(doc: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    this.codeLenses = []

    if (templateConfig.copyRequest) {
      this.codeLenses.push(
        new vscode.CodeLens(this.HEADER_RANGE, {
          title: `${localize.getLocalize('command.local.copyRequest')}`,
          command: 'cmd.local.copyRequest',
          arguments: [{ path: doc.fileName }],
        })
      )
    }

    this.codeLenses.push(
      new vscode.CodeLens(this.HEADER_RANGE, {
        title: `${localize.getLocalize('text.updateButton')}`,
        command: 'cmd.local.updateInterface',
        arguments: [{ path: doc.fileName }],
      })
    )

    return this.codeLenses
  }
}

vscode.workspace.registerTextDocumentContentProvider(SwaggerInterfaceProvider.scheme, new SwaggerInterfaceProvider())

vscode.languages.registerCodeLensProvider({ scheme: SwaggerInterfaceProvider.scheme }, new CodelensProvider())

// TODO 多目录处理
const savePaths = [config.extConfig.savePath]
config.extConfig.swaggerJsonUrl.forEach((v) => {
  if (v.savePath) {
    savePaths.push(v.savePath)
  }
})

vscode.languages.registerCodeLensProvider(
  { scheme: 'file', language: 'typescript', pattern: `${WORKSPACE_PATH}/{${savePaths.join(',')}}/**/*.d.ts` },
  new CodelensProviderLocal()
)
