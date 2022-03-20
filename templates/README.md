## 生成模板

## Interface 模板

| 方法名       | 参数                                       | 返回值 |
| ------------ | ------------------------------------------ | ------ |
| namespace    | TreeInterface                              | string |
| params       | TreeInterface                              | string |
| paramsItem   | TreeInterfacePropertiesItem, TreeInterface | string |
| response     | TreeInterface                              | string |
| responseItem | TreeInterfacePropertiesItem, TreeInterface | string |

详细类型参考 [TemplateBaseType](../src/tools/get-templates.ts#L17)

## 示例

#### 添加分组前缀

```js
function namespace(params) {
  return `${params.groupName.replace(/[\-\n\s\/\\]/g, '_')}_${params.pathName}`
}

module.exports = { namespace }
```

#### 将字段名转化为大驼峰

```js
/**
 * 首字母大写
 * @param {String} str
 */
function toUp(str) {
  if (typeof str !== 'string') return ''
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function paramsItem(item, params) {
  if (params.groupName === 'demo-1') return // groupName 为 demo-1 时忽略模板定制

  return `${toUp(item.name)}${item.required ? ':' : '?:'} ${item.type}`
}
```

## 注意

- 高端定制，尊享奢华。
- 请不要对模板处理函数的参数直接进行修改，否则可能产生破坏性影响。
