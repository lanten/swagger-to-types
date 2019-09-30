import { OutputChannel, window } from 'vscode'
import { EXT_NAME } from './const'

class Log {
  public outputChannel: OutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel(EXT_NAME)
  }

  // public get outputChannel(): OutputChannel {
  //   if (!this._channel) this._channel =
  //   return this._channel
  // }

  public raw(...values: any[]) {
    this.outputChannel.appendLine(values.map(i => i.toString()).join(' '))
  }

  public log(message: string, intend = 0) {
    this.outputChannel.appendLine(`${'\t'.repeat(intend)}${message}`)
  }

  public info(message: string, intend = 0) {
    this.log(`[INFO] - ${Date.now()} : ${message}`, intend)
  }

  public success(message: string, intend = 0) {
    this.log(`[SUCCESS] - ${Date.now()} : ${message}`, intend)
  }

  public warn(message: string, intend = 0) {
    this.log(`[WARN] - ${Date.now()} : ${message}`, intend)
  }

  public error(err: Error | string, prompt = true, intend = 0) {
    if (prompt) window.showErrorMessage(`${EXT_NAME} Error: ${err.toString()}`)
    if (typeof err === 'string') {
      this.log(`[ERROR] - ${Date.now()} : ${err}`, intend)
    } else {
      this.log(`[ERROR] - ${Date.now()} : ${err.name}: ${err.message}\n${err.stack}`, intend)
    }
  }

  public divider() {
    this.outputChannel.appendLine('\n――――――\n')
  }
}

const log = new Log()
export default log
