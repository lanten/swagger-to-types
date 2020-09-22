import { BaseTreeProvider, BaseTreeItem } from '../core'
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
    return itemList.map((item, index) => {
      const title = item.title || item.url
      const options: BaseTreeItemOptions = {
        index,
        title,
        type: 'group',
        subTitle: item.title ? item.url : '',
        collapsible: 0,
        command: {
          title,
          command: 'api.group.onSelect',
          arguments: [{ ...item, index }],
        },
      }

      return new ApiLocalItem(options)
    })
  }

  refresh(): void {
    this.treeList = []
    this._onDidChangeTreeData.fire(undefined)
  }
}

export class ApiLocalItem extends BaseTreeItem {}
