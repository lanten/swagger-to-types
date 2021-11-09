# Change Log

All notable changes to the "swagger-to-types" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [TODO]

- [ ] 一键复制请求函数代码
- [ ] 自定义请求函数模板

## [1.1.6] 2021-11-09

- v2 api 根级参数处理
- 文案修正

## [1.1.4] 2021-11-07

- 打开接口详情不重复创建新 tab [#15](https://github.com/lanten/swagger-to-types/issues/15)
- 修复未分组接口不显示问题
- 修复无效分组接口不现实问题

- 添加 openapi 3.0 支持，目前测试样本不多，如发现问题请及时反馈。
- 优化接口预览

## [1.1.3] 2021-08-25

### Added

- 优化对象解析
- 支持导入本地文件

## [1.1.2] 2021-06-09

### Fixed

- 修复分组批量保存失败问题

### Changed

- 同一 path 多 method 支持
- 加载状态优化

## [1.1.1] 2021-04-20

### Changed

- 有变更的接口输出路径, 以便于定位

## [1.1.0] 2021-04-16

### Changed

- 搜索接口后高亮本地列表
- 标题栏添加更新接口按钮
- 一键更新时比对内容, 只更新有变化的接口

## [1.0.9] 2021-03-11

#### Fixed

- 修复已知 BUG

## [1.0.8] 2021-03-06

#### Fixed

- 修复错误 url 阻塞进程的问题 [#16](https://github.com/lanten/swagger-to-types/issues/16)

## [1.0.7] 2020-12-16

### Fixed

- 修复 ref 解析错误问题

## [1.0.6] 2020-11-24

### Fixed

- 修复在缺少参数的情况下多余空行的问题

### Added

- 添加枚举类型支持
- 添加默认值注释

## [1.0.5] 2020-11-04

### Fixed

- 更新接口时数据不刷新问题
- 更新成功后激活日志面板

### Changed

- 优化解析器空行
- 工作区无配置时隐藏状态栏按钮

---

## [1.0.4] 2020-10-22

### Fixed

- 修复一些 bug

### Changed

- 优化解析器
- 应用激活不主动创建文件夹

---

## [1.0.3] 2020-10-21

### Added

- 添加 `baseUrl` 展示

### Fixed

- 修复一些 bug

### Changed

- 优化解析器
- 更新自述

---

## [1.0.2] 2020-10-19

### Fixed

- 修复一些 bug

### Changed

- 优化解析器

---

## [1.0.1] 2020-10-19

### Added

- 一键更新时, 已忽略(`ignore`)的接口跳过更新

### Fixed

- 老版本接口文件兼容问题
- 单个接口更新本地列表不刷新
- 一键更新本地列表不刷新

### Changed

- 优化解析器

---

## [1.0.0] 2020-10-16

### Added

- 支持打开关联的链接
- 支持一键保存接口 (分组批量保存)
- 支持多条件模糊搜索
- 添加本地接口列表树视图
- 本地接口单个文件更新
- 一键更新已保存的接口 (支持快捷键)
- 状态栏添加一键更新按钮
- 删除本地接口文件
- 未打开工作区时展示引导
- 为配置 SwaggerJSON 时展示引导

### Changed

- 整合接口列表视图
- 优化添加项目功能
- 优化 Swagger 类型定义不规范问题
- 使用 [codIcon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) 替换 svg 图标
