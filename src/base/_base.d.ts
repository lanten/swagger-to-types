import vscode from 'vscode'

declare global {
  /**
   * BaseTreeItem 参数
   */
  interface BaseTreeItemOptions {
    /** 附表图 */
    subTitle: string
    /** 可折叠状态 0:不可折叠 1:折叠 2:展开 */
    collapsible?: 0 | 1 | 2
  }
}
