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

编辑 `.vscode/swagger-to-types.template.js` 文件

```js
function namespace(params) {
  return `${params.groupName.replace(/[\-\n\s\/\\]/g, '_')}_${params.pathName}`
}

module.exports = { namespace }
```

#### 将字段名转化为大驼峰

编辑 `.vscode/swagger-to-types.template.js` 文件

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
  // 项目标题(swaggerToTypes.swaggerJsonUrl[number].title) 为 demo-1 时忽略定制方案
  if (params.groupName === 'demo-1') return

  return `${toUp(item.name)}${item.required ? ':' : '?:'} ${item.type}`
}

module.exports = { paramsItem }
```

## 注意

- 高端定制，尊享奢华。
- 请不要对模板处理函数的参数直接进行赋值操作，这可能产生破坏性影响。
