import { OutputChannel, window } from 'vscode'
import { EXT_NAME } from './const'
import { formatDate } from './utils'

/** 日志类型 */
export type LogTypes = 'INFO' | 'WARN' | 'ERROR'

class Log {
  public outputChannel: OutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel(EXT_NAME)
  }

  public log(type: LogTypes, message: string, intend = 0) {
    this.outputChannel.appendLine(
      `${'\t'.repeat(intend)} [${type} - ${formatDate(new Date(), 'HH:mm:ss.ms')}] ${message}`
    )
    return message
  }

  /**
   * 记录日志
   * @param message
   * @param prompt 是否弹窗提示
   * @param intend
   */
  public info(message: string, prompt = false, intend = 0) {
    const type: LogTypes = 'INFO'
    if (prompt) window.showInformationMessage(message)
    return this.log(type, message, intend)
  }

  /**
   * 记录警告日志
   * @param message
   * @param prompt 是否弹窗提示
   * @param intend
   */
  public warn(message: string, prompt = false, intend = 0) {
    const type: LogTypes = 'WARN'
    if (prompt) window.showWarningMessage(message)
    return this.log(type, message, intend)
  }

  /**
   * 记录错误日志
   * @param err 错误信息
   * @param prompt 是否弹窗提示
   * @param intend 缩进
   */
  public error(err: Error | string, prompt = false, intend = 0) {
    const type: LogTypes = 'ERROR'
    if (prompt) window.showErrorMessage(err.toString())
    if (typeof err === 'string') {
      return this.log(type, err, intend)
    } else {
      return this.log(type, `${err.name}: ${err.message}\n${err.stack}`, intend)
    }
  }

  public divider() {
    this.outputChannel.appendLine('\n――――――\n')
  }
}

export const log = new Log()
