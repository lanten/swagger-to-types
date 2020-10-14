import { BaseTreeProvider, BaseTreeItem, BaseTreeItemOptions } from '../core'
import { config, SwaggerJsonUrlItem } from '../tools'

export class ApiLocal extends BaseTreeProvider<ApiLocalItem> {
  public treeList: SwaggerJsonUrlItem[] = []

  getSwaggerSettings(): SwaggerJsonUrlItem[] {
    return config.extConfig.swaggerJsonUrl || []
  }

  getChildren(): Thenable<ApiLocalItem[]> {
    const treeItems = this.renderItem(this.getSwaggerSettings())

    return Promise.resolve(treeItems)
  }

  renderItem(itemList: SwaggerJsonUrlItem[]): ApiLocalItem[] {
    return itemList.map((item) => {
      const title = item.title || item.url
      const options: BaseTreeItemOptions = {
        title,
        type: 'group',
        subTitle: item.title ? item.url : '',
        collapsible: 0,
        command: {
          title,
          command: 'api.group.onSelect',
        },
      }

      return new ApiLocalItem(options)
    })
  }

  refresh(): void {
    this.treeList = []
    this._onDidChangeTreeData.fire(undefined)
  }

  /** 销毁时释放资源 */
  destroy(): void {}
}

export class ApiLocalItem extends BaseTreeItem {}
