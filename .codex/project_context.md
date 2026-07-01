# 工程上下文与 AI 编码规范 (Project Context)

> 本项目是一个 **VSCode Extension**，用于将 Swagger/OpenAPI 文档转换为 TypeScript 接口定义文件（`.d.ts`）。
> 非 Web 应用，所有"UI"均通过 VSCode 原生 API（TreeView、QuickPick、StatusBar、CodeLens、OutputChannel 等）实现。

## 1. 技术栈 (Technology Stack)

- **运行环境:** VSCode Extension Host (Node.js), `engines.vscode ^1.61.0`
- **核心语言:** TypeScript 5.7（`strict: true`，`target: ES2020`，`module: commonjs`）
- **VSCode API:** `@types/vscode ^1.61.0`（默认导入：`import vscode from 'vscode'`）
- **类型化 OpenAPI:** `openapi-types ^12.1.3`（提供 `OpenAPIV2.Document` / `OpenAPIV3.Document`）
- **HTTP:** Node 原生 `http` / `https`（不使用 axios 等第三方库）
- **构建:** `node script/build.js` → 调用 `tsc -p ./ --sourceMap false`，产物输出到 `out/`
- **入口:** `package.json#main` → `./out/src/main.js`，导出 `activate/deactivate`
- **包管理:** npm（仓库提供 `package-lock.json`）
- **代码规范:** ESLint 9 + Prettier 3（`eslint-config-prettier`）
- **测试:** mocha + `vscode-test`（当前仅脚手架，未覆盖业务）
- **发布:** `vsce publish`

## 2. 工程结构 (Project Structure)

```
src/
├── main.ts                 # 插件入口：activate / deactivate
├── core/                   # 领域核心：Swagger 解析 / 接口渲染 / TreeView 基类
│   ├── base.ts             # BaseTreeItem / BaseTreeProvider / openListPicker
│   ├── data-fetch.ts       # 拉取 swagger JSON（http/https 或本地模块）
│   ├── render-interface.ts # TreeInterface → .d.ts 文本
│   ├── swagger-parser-base.ts
│   ├── swagger-parser-v2.ts
│   ├── swagger-parser-v3.ts
│   └── index.ts            # 桶文件（barrel）
├── views/                  # TreeDataProvider 实现
│   ├── list.view.ts        # 远程接口列表（ViewList）
│   └── local.view.ts       # 本地 .d.ts 文件列表（ViewLocal）
├── commands/               # 命令注册（按领域分文件）
│   ├── list.cmd.ts         # cmd.list.*
│   ├── local.cmd.ts        # cmd.local.*
│   ├── common.cmd.ts       # cmd.common.*
│   └── template.cmd.ts     # cmd.template.*
└── tools/                  # 基础设施工具
    ├── config.ts           # 读写 vscode 配置 + 本地 local.config.json
    ├── const.ts            # 常量：EXT_NAME、WORKSPACE_PATH、CONFIG_GROUP 等
    ├── log.ts              # OutputChannel 日志单例
    ├── localize.ts         # 多语言（基于 package.nls*.json）
    ├── editor.ts           # CodeLensProvider / 预览文档
    ├── get-templates.ts    # 工作区自定义模板加载
    ├── io.ts / exec.ts / utils.ts / reg-exp.ts / vsc.ts
    └── index.ts            # 桶文件

types/                       # 全局 ambient 类型声明（无需 import）
├── global.d.ts              # AnyObj / ItemTypes / ctx
└── core.d.ts                # SwaggerJsonTreeItem / TreeInterface / FileHeaderInfo 等

templates/new.template.js   # 工作区模板默认骨架
script/build.js             # 构建脚本（清理 out + 调 tsc）
package.nls.json            # 英文语言包
package.nls.zh-cn.json      # 中文语言包
```

- **VSCode 贡献点:** 在 `package.json#contributes` 中定义；文案以 `%key%` 占位，运行时由 `package.nls*.json` 替换。
- **TreeView 容器:** `swagger-to-types`（ActivityBar），包含 `view.list` 与 `view.local`。
- **命令命名空间:** `cmd.<domain>.<action>`（如 `cmd.list.refresh`、`cmd.local.updateAll`）。

## 3. 编码规范 (Coding Guidelines)

### 命名惯例

| 目标 | 规则 | 示例 |
| --- | --- | --- |
| 文件/目录 | kebab-case（含 `.view.ts` / `.cmd.ts` 等领域后缀） | `list.view.ts`、`swagger-parser-v3.ts` |
| 类 / 组件 | PascalCase | `ViewList`、`OpenAPIV3Parser`、`BaseTreeItem` |
| interface / type | PascalCase | `SwaggerJsonUrlItem`、`CodeConfig` |
| enum | PascalCase（枚举键优先中文） | — |
| namespace | camelCase | — |
| 函数 / 变量 | camelCase | `getSwaggerJson`、`renderToInterface` |
| 常量 | UPPER_SNAKE_CASE | `WORKSPACE_PATH`、`CONFIG_GROUP`、`BASE_INDENTATION` |
| 单例导出 | 小写同名 | `export const config = new Config()`、`export const log = new Log()` |
| 命令 ID | `cmd.<domain>.<action>` | `cmd.list.saveInterface` |
| setContext key | `<CONFIG_GROUP>.<name>` / `config.<CONFIG_GROUP>.<key>` | `swaggerToTypes.localFiles` |

### 模块风格

- **导入:** `import vscode from 'vscode'`（默认导入，配合 `esModuleInterop + allowSyntheticDefaultImports`）。
- **桶文件:** 每个子目录提供 `index.ts` 以 `export *` 汇聚，外部仅 `from '../core'` / `from '../tools'`。
- **全局类型:** 跨模块的领域类型（`TreeInterface`、`SwaggerJsonTreeItem`、`FileHeaderInfo` 等）放在 `types/*.d.ts`，通过 `tsconfig.include` 生效，使用时**不需要 import**。
- **TypeScript:**
  - 使用 `strict` + `useUnknownInCatchVariables: false`。
  - 积极使用可选链（`?.`）；非空用 `isDef()`。
  - 字符串拼接优先模板字符串。
  - 单变量多分支用 `switch`（见 `list.cmd.ts#saveInterface`、`list.view.ts#getChildren`）。
- **异步:** Promise 与 async/await 混用均可；长链路用 `async/await`，简单回调包装沿用 `new Promise(...)`（参见 `data-fetch.ts`）。
- **注释:** 仅对功能段/公共 API 注释，**用中文 JSDoc**；禁止逐行叙述式注释。
- **错误处理:** 尽量避免 `try/catch`；异常通过 `log.error(err, prompt?)` 输出到 OutputChannel，并按需弹窗。仅在"模块动态加载/JSON.parse/fs"等无法用返回值判别的场景使用 `try/catch`。

## 4. 核心架构模式 (Architectural Patterns)

### 数据流

```
settings.json (vscode config)
    │
    ▼
config (Config 单例)  ←─────────────┐
    │                               │
    ▼                               │
ViewList / ViewLocal (TreeDataProvider)
    │                               │
    │ getSwaggerJson (http/https 或 requireModule)
    ▼                               │
OpenAPIV2Parser / OpenAPIV3Parser (继承 BaseParser)
    │                               │
    ▼                               │
SwaggerJsonTreeItem[]  ──► TreeItem 渲染                        
    │                                                           
    ▼ (用户触发 saveInterface)                                  
renderToInterface(TreeInterface) ──► saveDocument ──► *.d.ts    
    │
    ▼
ViewLocal.updateSingle / refresh ──► StatusBar / CodeLens
```

### 关键模式

- **单例基础设施:** `config` / `log` / `localize` / `templateConfig` 以 `export const x = new X()` 暴露，副作用在构造函数/模块加载时完成（如 `get-templates.ts` 末尾直接调用 `getWorkspaceTemplateConfig()`）。
- **TreeView 抽象:** 所有 TreeDataProvider 继承 `BaseTreeProvider<T>`（提供 `_onDidChangeTreeData` / `refresh` / `debounce`）；所有 TreeItem 继承 `BaseTreeItem<ExtOptions>`（统一处理 label/description/tooltip/iconPath/contextValue）。
- **命令注册模板:** 每个 `*.cmd.ts` 导出 `registerXxxCommands(...)`，内部以对象字面量聚合，循环 `vscode.commands.registerCommand(\`cmd.<domain>.${key}\`, fn)`。`main.ts` 统一调用。
- **解析器继承:** `BaseParser` 提供 `addGroup` / `pushGroupItem` / `getKebabNameByPath` / `getCamelNameByKebab`；V2/V3 子类实现 `parse()`。
- **渲染与模板扩展:** `renderToInterface` 是纯函数；工作区可通过 `.vscode/swagger-to-types.template.{js,cjs}` 动态注入 `namespace/params/paramsItem/response/responseItem/copyRequest` 钩子（由 `requireModule` + `templateConfig` 实现）。
- **国际化:** `package.json` 中以 `%key%` 占位；代码中使用 `localize.getLocalize('key', ...params)`，参数以 `${1}`、`${2}` 形式回填。
- **防抖:** 刷新类操作统一使用 `BaseTreeProvider#debounce(cb, 500)` 以避免重复加载。
- **状态回写:** 使用 `vscode.commands.executeCommand('setContext', key, val)` 驱动 `package.json#menus` 的 `when` 条件（如 `swaggerToTypes.hasCopyRequestFn`、`swaggerToTypes.localFiles`）。

## 5. 最佳实践与禁忌 (Best Practices)

### ✅ 推荐做法 (PREFER)

- 新增功能优先复用 `tools/`、`core/base.ts` 已有抽象（`BaseTreeItem`、`BaseTreeProvider`、`openListPicker`、`preSaveDocument`、`showLoading`、`saveDocument`、`requireModule` 等）。
- 新增命令 → 在对应 `*.cmd.ts` 的 `commands` 对象中加一项；**不要**在其他位置散落 `vscode.commands.registerCommand`。
- 新增 VSCode 配置项 → 同步更新 `package.json#contributes.configuration` + `CONFIG_LIST`（`tools/const.ts`）+ `CodeConfig` 接口（`tools/config.ts`）+ 两份 `package.nls*.json`。
- 新增用户可见文本 → 一律走 `localize.getLocalize(key)`，键同时加入 `package.nls.json` 与 `package.nls.zh-cn.json`。
- 日志 → `log.info/warn/error`；需要提示用户时传 `prompt = true`。
- 跨文件共享的领域类型 → 写入 `types/*.d.ts` 的 `declare global`。
- 新增子模块 → 补 `index.ts` 重新导出（保持桶文件风格一致）。

### ❌ 禁止 / 避免 (AVOID)

- ❌ **不加三方库**（严格约束）：新增依赖需与用户确认；优先用 Node/VSCode 内置能力。
- ❌ 不要散写 `console.log`；使用 `log.*`（输出至专属 OutputChannel）。
- ❌ 不要在业务中直接 `workspace.getConfiguration()`；走 `config.extConfig`、`config.setCodeConfig`。
- ❌ 避免 `try/catch`（尤其围绕纯函数/可返回错误值的 API）；确需使用时仅包裹最小块，并走 `log.error`。
- ❌ 不要写英文注释/叙述式注释/`// Import the module` 类噪音注释。
- ❌ 不要使用 `any` 作为默认类型（局部兜底除外）；定义明确的 interface/type。
- ❌ 不要为"重构/美化"而改动既有风格；未被要求时保持最小改动范围。
- ❌ 不要为 2020 年以前的运行时兼容写 polyfill / 降级代码。
- ❌ 不要在 TreeDataProvider 之外持有 VSCode UI 资源（StatusBar 等）的生命周期。

## 6. 代码范例 (Golden Snippets)

### 6.1 标准命令模块（`src/commands/<domain>.cmd.ts`）

```typescript
import vscode from 'vscode'

import { log, localize } from '../tools'
import { ViewList } from '../views/list.view'

export function registerDemoCommands(viewList: ViewList) {
  const commands: Record<string, any> = {
    /** 刷新示例 */
    refresh: () => viewList.refresh(),

    /** 选中示例项 */
    async onSelect(item: TreeInterface) {
      if (!item?.pathName) {
        return log.error(localize.getLocalize('error.action'), true)
      }
      // 业务逻辑
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.demo.${command}`, commands[command])
  }
}
```

> 然后在 `src/commands/index.ts` 追加 `export * from './demo.cmd'`，并在 `src/main.ts#activate` 中调用 `registerDemoCommands(viewList)`。

### 6.2 标准 TreeView 模块（`src/views/<name>.view.ts`）

```typescript
import vscode from 'vscode'

import { BaseTreeProvider, BaseTreeItem, BaseTreeItemOptions } from '../core'
import { log } from '../tools'

export interface ExtDemoItemOptions {
  /** 业务主键 */
  demoKey: string
}

export class ViewDemo extends BaseTreeProvider<DemoItem> {
  public dataList: SwaggerJsonTreeItem[] = []

  constructor() {
    super()
    this.initData()
  }

  /** 初始化数据源 */
  private initData() {
    // ...
    this._onDidChangeTreeData.fire(undefined)
  }

  getChildren(): Thenable<DemoItem[]> {
    return Promise.resolve(this.dataList.map((item) => this.renderItem(item)))
  }

  renderItem(item: SwaggerJsonTreeItem): DemoItem {
    const options: BaseTreeItemOptions & ExtDemoItemOptions = {
      title: item.title,
      subTitle: item.subTitle,
      type: item.type,
      collapsible: 0,
      demoKey: item.key,
      contextValue: item.type,
    }
    return new DemoItem(options)
  }

  /** 刷新（500ms 防抖） */
  public refresh(): void {
    this.debounce(() => {
      this.initData()
      log.info('refresh: view.demo')
    }, 500)
  }
}

export class DemoItem extends BaseTreeItem<ExtDemoItemOptions> {}
```

### 6.3 配置读写 & 日志

```typescript
import { config, log, localize } from '../tools'

const { savePath, swaggerJsonUrl } = config.extConfig
log.info(localize.getLocalize('text.success.create', savePath))

config.setCodeConfig({ savePath: 'types/swagger-interfaces' })
```
