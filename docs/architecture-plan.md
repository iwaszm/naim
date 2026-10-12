# NAIM 架构与手机 PWA 路线

更新：2026-10-12。本文是基于当前 `main`（`bc84019`）的实施计划，不代表这些模块已经落地。

## 实施记录（2026-10-12）

已加入版本化信号契约、会话/推理适配器、默认手机 Face 体验、延迟加载的研究与舞台视图、PWA manifest/service worker/本地 WASM，以及经用户主动同意的 IndexedDB 数值记录与导出。下文目录仍是长期目标：部分纯计算仍位于 `src/core`，为保留现有 API 暂未整体迁移。真实手机的权限、安装、离线和性能验收仍需设备测试。

## 产品定位

NAIM 目前是浏览器端的多模态感知与反馈研究原型：摄像头输入经 MediaPipe 得到面部特征，映射为 AU proxy、表情倾向和 appraisal proxy，再驱动反馈与 Avatar。`Appraisal proxy` 是启发式估计，不能当作心理状态的客观测量或诊断。手机端应先提供清楚、稳定的「开始体验 → 授权摄像头 → 校准 → 实时反馈 → 结束」流程；研究调试和数据导出作为独立入口。

## 现状与结构问题

- Vite、React、TypeScript 单页应用；`App.tsx` 在 Stage 和 Research 两套 UI 间切换。
- `src/core/recognition`、`feedback`、`avatar` 已有规则与 adapter 接口，值得保留。
- `useFaceTracking.ts` 同时负责摄像头、两套 MediaPipe 推理、帧循环、校准读取和状态发布，是最优先拆开的边界。
- `FaceFrame` 同时包含原始特征、推断结果和调试用姿态数据，未来持久化与跨线程传输需要更小且带版本的契约。
- Face 模型虽在本地，Tasks Vision WASM 仍从 CDN 加载；Holistic 与 VRM 资源很大。当前没有 manifest、service worker 或离线策略，不能视为可安装的离线 PWA。
- 研究导出目前只是禁用按钮；不要把它算作已完成的数据模块。

## 建议的目标目录

保持单一前端应用，先按功能与依赖边界整理，不急于拆 monorepo 或后端服务。

```text
src/
  app/                    # 路由/模式入口、provider、全局错误处理
  features/
    session/              # 开始、停止、权限、设备、生命周期
    calibration/          # neutral 校准流程和参数
    live-feedback/        # 面向手机的体验页与反馈呈现
    research/             # AU/表情/appraisal 调试与未来导出
    avatar/               # Avatar UI、VRM 加载、意图呈现
  domain/
    signals/              # 小型、版本化的数据契约
    recognition/          # AU、expression、appraisal 纯计算和 adapter
    feedback/             # 反馈策略纯计算和 adapter
    avatar/               # Avatar intent 纯计算和 adapter
  platform/
    camera/               # getUserMedia、前后摄选择、权限错误
    vision/               # MediaPipe 适配器、模型加载、推理调度
    storage/              # 仅用户同意后的本地 session 数据
    pwa/                  # 安装、更新、缓存和离线状态
  shared/                 # 通用 UI、少量工具和样式 token
public/
  models/                 # 按需下载的模型，维护清单和版本
  avatars/                # 按需下载的 VRM，维护清单和版本
docs/                    # 架构、数据契约、验证方案
```

依赖方向：`app/features → domain`，`app/features → platform`；`domain` 不依赖 React、DOM、MediaPipe 或 Three.js。`platform` 只把外部 SDK 结果转换成 domain 契约。模块之间通过公开入口与类型调用，避免跨目录读取内部实现。保持现有 adapter/registry 模式，但 registry 的选择放在 app 组合层；规则逻辑应可在 Node 中独立验证。

## 关键模块边界

| 模块 | 负责 | 不负责 |
| --- | --- | --- |
| session | 摄像头权限、设备切换、前后台暂停/恢复、结束时释放资源 | AU 或反馈规则 |
| vision | Face/Pose/Hand 推理与节流；输出带时间戳的特征 | UI 状态或心理解释 |
| recognition | 纯函数转换、校准、模型 adapter、置信度与版本 | 摄像头和资源下载 |
| feedback | 由 proxy 和上下文生成提示/Avatar 意图 | 直接渲染组件 |
| live-feedback | 手机主流程和可访问的反馈 UI | 原始模型控制 |
| research | 调试指标、标记、未来的导出 | 默认手机首页 |
| avatar | 可关闭、延迟加载的 VRM 呈现 | 核心识别链路 |

高频帧留在非 React 的实时通道，只把降频后的显示快照送入 Zustand。原始视频默认不存储；若研究功能要保存任何信号，先定义用户同意、保留期限、删除和导出行为。给采样帧加 `schemaVersion`、单调时间戳、模型/规则版本、缺失值与质量标记，防止后续实验数据混淆。

## 手机 PWA 的架构要求

1. **移动优先流程**：单列布局、安全区、触控目标、横竖屏和小视口；主界面只放摄像头状态、校准、核心反馈与停止按钮，研究面板延迟加载。
2. **摄像头生命周期**：仅在用户操作后请求权限，优先前置摄像头并允许切换；页面隐藏、锁屏、路由离开时暂停推理并释放或明确管理 MediaStream；恢复时重新校验权限和模型状态。不要假设 PWA 能在后台持续摄像。
3. **性能分级**：Face 为基础模式；Pose/Hand 和 3D Avatar 由能力检测与用户选择启用。限制输入分辨率和推理频率，记录设备上的帧耗时；必要时将推理迁到 Worker/OffscreenCanvas，但先实测浏览器支持。
4. **安装与离线**：加 manifest、图标和 service worker。缓存 shell 与明确版本的核心 face 模型/WASM；大型 Holistic、VRM 资源运行时按需获取并设缓存上限与清理策略。更新提示应在 session 结束后生效，避免中途替换模型。
5. **部署路径**：当前 GitHub Pages 使用 `/naim/` base；manifest、service worker scope、模型 URL 都须在该子路径验证。正式域名可另行决定，不把根路径写死。
6. **安全与隐私**：全程 HTTPS；默认本地推理、无摄像头画面上传；把 proxy 性质和数据选择说明放在首次使用流程。研究记录与产品反馈要明确区分。

## 分阶段迁移与验收

### 1. 固定契约和拆开运行时

先给 `FaceFrame` 拆出 `VisionSample`、`RecognitionResult`、`DisplaySnapshot`，保留兼容转换。把 `useFaceTracking` 中的媒体流、推理调度和状态发布移入 `session`/`platform`，统一 stop/cleanup。验收：现有 Stage/Research 功能不变，`npm run smoke:core` 与 `npm run build` 通过；停止和重复启动后摄像头 track 不残留。

### 2. 拆手机体验和研究工具

建立手机主流程，Research 页面按需加载；Avatar/Pose/Hand 变成可选能力，默认只加载 Face。验收：低端手机可完成授权、校准、实时反馈、结束；拒绝权限或无摄像头时有明确恢复路径；记录首屏和推理性能基线。

### 3. PWA 基础

加入 manifest、图标、缓存与更新策略，并把模型/WASM 路径固定到版本化资源。验收：HTTPS 手机浏览器可安装；首次联网后重新打开能显示离线界面并运行已缓存的基础 Face 模式；在 GitHub Pages 子路径验证更新与资源请求。

### 4. 研究数据与扩展

按独立模块实现显式同意后的 IndexedDB session 记录、事件标记、CSV/JSON 导出与删除；再评估后端同步。验收：可追溯 schema/model 版本，断网可使用本地数据，用户可以删除全部记录。

## 近期优先级

首个改造 PR 建议只完成阶段 1；不要在同一 PR 中同时换 UI、引入 PWA 缓存和替换 MediaPipe。当前最大的手机端风险是默认同时启动 FaceLandmarker 和 Holistic，以及大模型/VRM 静态资源对首屏和离线缓存的压力；应先测设备性能，再定默认能力级别。
