# swagger-to-types README

将 Swagger JSON 导出为 Typescript interface

## 预览

![](assets/demo.png)

## Config

```json
{
  // 一个数组, Swagger Json Url 示例: { "title": "New Project", "url": "http://api.xxxx.com/v2/api-docs"}
  "swaggerToTypes.swaggerJsonUrl": [
    {
      "title": "测试项目",
      "url": "http://api.xxxxx.com/v2/api-docs"
    }
  ],
  // Typescript 接口文件保存路径
  "swaggerToTypes.savePath": ".vscode/swagger-to-types"
}
```

## 注意

- 目前仅支持 swagger v2 API
- 暂不支持自定义解析器
- 复杂的接口也许会有问题