import vscode from 'vscode'

/**
 * 显示一个 Loading
 * @param message
 * @returns
 */
export function showLoading(message: string) {
  let stopLoading: () => void = () => void 0

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: message,
      cancellable: false,
    },
    () => {
      return new Promise((resolve) => {
        stopLoading = () => resolve(false)
      })
    }
  )

  return stopLoading
}
