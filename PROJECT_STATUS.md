# NAIM 项目进度记录

更新时间：2026-05-19

## 1. 当前项目定位

NAIM 当前定位为：

**基于开源 MediaPipe Web 模型的 AU proxy、基础表情识别、Appraisal proxy 与反馈交互系统。**

关键原则：

- MediaPipe 提供底层 face landmarks / blendshapes。
- 系统在此基础上延伸出 AU proxy、expression scores、appraisal proxy。
- Appraisal 不宣称为心理真值测量，而是基于多模态信号的 proxy estimate。
- CSV/JSON 数据导出、3D avatar、Pose/Hand、语音反馈均为后续可选增强模块。

## 2. 已完成内容

### 2.1 项目结构

已建立 Vite + React + TypeScript 前端项目骨架。

主要目录：

```text
src/
├── components/
│   ├── CameraDebugger/
│   ├── Dashboard/
│   ├── FeedbackPanel/
│   ├── ResearchExportPanel/
│   └── AvatarScene/
├── core/
│   ├── features/
│   ├── feedback/
│   ├── filters/
│   ├── mediapipe/
│   └── recognition/
├── hooks/
├── store/
├── styles/
└── types/
```

### 2.2 MediaPipe 感知层

已完成：

- `@mediapipe/tasks-vision` 接入。
- `FaceLandmarker` wrapper。
- 摄像头启动/停止逻辑。
- 本地 MediaPipe 模型资产：
  - `public/models/face_landmarker.task`
- HTTPS 局域网 dev server 支持，用于有摄像头电脑访问。
- 浏览器摄像头实测已跑通。

### 2.3 实时数据链路

当前实时链路已跑通：

```text
Camera
→ MediaPipe FaceLandmarker
→ raw blendshapes
→ raw AU proxy
→ neutral-calibrated AU proxy
→ expression scores
→ appraisal proxy
→ feedback policy
→ dashboard display
```

### 2.4 Neutral calibration

已实现 neutral calibration，当前行为：

- `Calibrate` 按钮集成在 CameraDebugger 中，不单独占用 block。
- 点击后自动采集 3 秒 neutral 状态。
- calibration 完成后立即作用于 AU，不需要重启 tracking。
- 后续 AU / expression / appraisal / feedback 均使用校正后的 AU。
- UI 中显示 calibration 进度与 neutral baseline 状态。

校正逻辑：

```ts
correctedAU = sensitivityCurve(max(0, rawAU - neutralBaseline - deadband))
```

### 2.5 Per-AU sensitivity 机制

已实现每个 AU 独立的 sensitivity 配置：

文件：

```text
src/core/recognition/auCalibrationConfig.ts
```

每个 AU 支持：

- `deadband`：中性噪声阈值。
- `gain`：线性放大倍率。
- `gamma`：曲线形状，`gamma < 1` 会放大小幅变化。

目的：

- AU1 / AU2 / AU12 / AU26 等 MediaPipe 本来幅度较大的 AU 不再压倒其他 AU。
- AU4 / AU7 / AU15 / AU23_24 等小范围但语义重要的 AU 得到适度增强。

当前重点增强：

- AU4 brow lowerer
- AU7 lid tightener
- AU15 lip corner depressor
- AU23_24 lip tightener / pressor proxy

### 2.6 UI / Dashboard

已完成基础界面：

- Camera panel：视频、FPS、Start tracking、Calibrate、raw blendshapes。
- Dashboard：AU proxy、expression tendency、appraisal proxy。
- Feedback panel：根据 appraisal proxy 输出温和反馈提示。
- Optional export placeholder。
- Future avatar placeholder。

设计方向：深色实验室风格，强调实时信号、proxy、安全边界。

## 3. 当前规则层状态

### 3.1 AU proxy

当前 AU proxy 主要由 MediaPipe blendshapes 映射得到，经过：

1. raw blendshape extraction
2. raw AU mapping
3. neutral baseline subtraction
4. per-AU sensitivity curve

### 3.2 Expression scores

当前仍为规则版 AU → expression mapping。

已决定：

- 暂不继续手调 expression 权重。
- 后续计划使用标记过的数据库来优化 AU 与表情之间的连接。
- 因此当前 expression layer 保持 rule-based baseline，等待未来 dataset-driven 优化。

### 3.3 Appraisal proxy

当前 appraisal proxy 为规则版估计，维度包括：

- pleasantness
- novelty
- obstruction
- lowControl
- confidence
- evidence

注意：这些仍是 proxy，不是心理诊断或心理真值。

## 4. 验证状态

已通过：

```bash
npm run smoke:core
npm run build
```

当前 smoke test 覆盖：

- smile → happiness / pleasantness 上升。
- surprise → surprise / novelty 上升。
- neutral baseline 可以将 AU12 / AU26 压回 0。
- 小幅 AU4 输入可被 per-AU sensitivity 放大。

最近一次 smoke 输出：

```text
core smoke ok {
  smile: { happiness: '0.992', pleasantness: '0.990' },
  surprise: { surprise: '0.928', novelty: '0.916' },
  calibration: { AU12: '0.000', AU26: '0.000' },
  subtleAU4: '0.334'
}
```

## 5. 重要决策

1. **Neutral calibration 是必须步骤**  
   用于消除个体自然表情、摄像头角度、光线造成的 AU 偏移。

2. **Calibration 直接作用于 AU**  
   calibration 完成后实时生效，不需要重启 tracking。

3. **AU 需要 per-AU sensitivity**  
   因为不同 AU 在 MediaPipe blendshape 中动态范围不同，不能使用同一尺度。

4. **Expression layer 暂时 pending**  
   后续用标记数据库优化 AU → expression 连接，暂不继续人工过拟合规则。

5. **CSV/JSON 导出不是当前核心**  
   作为后续研究增强模块。

## 6. 下一步建议

推荐下一步不是继续调 expression，而是做：

### Dataset-ready / Model-adapter 架构

目标：为未来标记数据库优化 AU → expression 做准备。

建议内容：

- 定义统一样本格式：
  - raw blendshapes
  - raw AU
  - calibrated AU
  - expression label / intensity
  - session metadata
- 抽象 `ExpressionModelAdapter`：
  - 当前使用 rule-based adapter。
  - 未来可替换为数据库训练出的参数或轻量模型。
- 保持 expression layer 可替换，避免未来重构。

## 7. 当前运行方式

安装：

```bash
npm install
```

开发：

```bash
npm run dev
```

局域网 HTTPS 测试地址示例：

```text
https://192.168.178.25:5176/
```

构建：

```bash
npm run build
```

核心 smoke test：

```bash
npm run smoke:core
```

## 8. Dataset-ready / Expression adapter 更新

已完成 AU → expression 的可替换 adapter 架构。

新增文件：

```text
src/core/dataset/sampleTypes.ts
src/core/recognition/expressionAdapters/ExpressionModelAdapter.ts
src/core/recognition/expressionAdapters/RuleBasedExpressionAdapter.ts
src/core/recognition/expressionAdapters/index.ts
src/core/recognition/modelRegistry.ts
```

当前行为：

- pipeline 不再直接依赖 `auToExpression()`。
- pipeline 通过 `getExpressionAdapter().predict(...)` 获取 expression scores。
- 当前默认 adapter 是 `ruleBasedExpressionAdapter`。
- `FaceFrame` 中记录 `expressionModelId`，便于之后追踪当前使用的 expression model。

设计目的：

- 当前规则版 AU → expression 保持不变。
- 未来接入标记数据库后，可新增 dataset-trained adapter，而不需要改动上层 pipeline/UI。
- 已定义 `NaimFrameSample`，为后续标注数据、训练数据、导出数据统一格式做准备。

## 9. Appraisal adapter 更新

已完成 expression → appraisal 的可替换 adapter 架构。

新增文件：

```text
src/core/recognition/appraisalAdapters/AppraisalModelAdapter.ts
src/core/recognition/appraisalAdapters/RuleBasedAppraisalAdapter.ts
src/core/recognition/appraisalAdapters/index.ts
```

更新内容：

- `modelRegistry.ts` 现在同时管理 expression adapter 与 appraisal adapter。
- pipeline 不再直接依赖 `expressionToAppraisalProxy()`。
- pipeline 改为调用 `getAppraisalAdapter().predict(...)`。
- 当前默认 adapter 是 `ruleBasedAppraisalAdapter`。
- `FaceFrame` 中记录 `appraisalModelId`，便于之后追踪当前 appraisal 模型。

设计目的：

- 当前 rule-based appraisal proxy 保持不变。
- 未来可替换为 dataset-trained、context-aware 或 external appraisal adapter。
- adapter 输入已预留 `context`，支持未来加入 event marker、task state、自评量表等信息。

## 10. Feedback adapter 更新

已完成 feedback policy 的可替换 adapter 架构。

新增文件：

```text
src/core/feedback/adapters/FeedbackPolicyAdapter.ts
src/core/feedback/adapters/RuleBasedFeedbackAdapter.ts
src/core/feedback/adapters/index.ts
src/core/feedback/feedbackRegistry.ts
```

更新内容：

- `FeedbackPanel` 不再直接依赖固定规则函数，而是调用 `getFeedbackAdapter().select(...)`。
- 当前默认 adapter 是 `ruleBasedFeedbackAdapter`。
- feedback 输出统一为 `FeedbackOutput`，包含：
  - `tone`
  - `title`
  - `message`
  - `actionHint`
  - `avatarCue`
  - `voiceCue`
  - `evidence`
- `feedbackPolicy.ts` 保留 backward-compatible wrapper，方便旧调用不立刻失效。

设计目的：

- 当前文本反馈效果保持不变。
- 未来可替换为 avatar feedback、voice feedback、experiment-specific feedback 或 external feedback policy。
- 识别链路目前已完整模块化：

```text
MediaPipe
→ AU calibration
→ Expression adapter
→ Appraisal adapter
→ Feedback adapter
```

## 11. Avatar intent adapter 更新

已完成 avatar 接入前的 driver intent 层。

新增文件：

```text
src/core/avatar/adapters/AvatarIntentAdapter.ts
src/core/avatar/adapters/RuleBasedAvatarIntentAdapter.ts
src/core/avatar/adapters/index.ts
src/core/avatar/avatarRegistry.ts
```

更新内容：

- 新增 `AvatarIntent` 标准输出，包含：
  - `facialExpression`
  - `intensity`
  - `headCue`
  - `bodyCue`
  - `voiceTone`
  - `caption`
  - `evidence`
- 当前默认 adapter 是 `ruleBasedAvatarIntentAdapter`。
- `AvatarScene` 暂不加载 3D 模型，而是实时显示 avatar intent。
- Avatar orb 会根据 intent 改变视觉状态。

设计目的：

- 先建立 AU / Expression / Appraisal / Feedback → AvatarIntent 的中间层。
- 后续无论接 VRM、GLB、Live2D、语音或纯文本反馈，都复用同一 intent 层。
- 避免过早陷入 3D 模型 morph target 与资产适配问题。

## 12. Mirror avatar 与 Empathic avatar 分离

根据项目需求，avatar intent 已拆分为两个并行版本：

### Mirror Avatar

Mirror avatar 反映用户当前 appraisal 的结果。它不是支持用户，而是将用户 appraisal proxy 转换成 avatar 自发生成的表情、姿态和语音倾向。

示例：

```text
user lowControl appraisal → mirror uncertain / hesitant / tense
user obstruction appraisal → mirror frustrated / strained / tense
user pleasantness appraisal → mirror smile / warm / relax
```

### Empathic Avatar

Empathic avatar 根据用户当前 appraisal 给予支持性反馈。它不镜像用户的紧张或受阻，而是生成同理心回应。

示例：

```text
user lowControl appraisal → empathic concern / supportive / lean_in
user obstruction appraisal → empathic focused / calm / deescalate
user novelty appraisal → empathic curious / explain_or_confirm
```

更新内容：

- `AvatarIntent` 增加 `mode: 'mirror' | 'empathic'`。
- 新增 `ruleBasedMirrorAvatarIntentAdapter`。
- 原有 avatar intent adapter 改为 `ruleBasedEmpathicAvatarIntentAdapter`。
- `avatarRegistry` 现在按 mode 管理两个 adapter。
- `AvatarScene` 双栏显示 Mirror avatar 与 Empathic avatar intent。

当前两者都仍是 intent 层，不加载 3D 模型。后续接 VRM/GLB 时，应分别映射这两套 intent。

## 13. VRM prototype 接入

已将本地 VRoid 模型作为开发测试资产接入 AvatarScene。

本地文件：

```text
public/models-local/AvatarSample_S.vrm
```

注意：`public/models-local/` 已加入 `.gitignore`，该 VRM 文件仅用于本地开发测试，不应提交或公开分发。

新增文件：

```text
src/components/AvatarScene/VRMPreview.tsx
```

当前能力：

- 使用 Three.js + `@pixiv/three-vrm` 加载 VRM 1.0 模型。
- 在 AvatarScene 中显示 VRM preview。
- 当前 prototype 使用 Mirror avatar intent 驱动 VRM preset expression：
  - `smile` → `happy`
  - `surprise` → `surprised`
  - `frustrated` → `angry`
  - `uncertain` / `concern` → `sad`
  - `soften` → `relaxed`
- 暂未接入骨骼姿态、头部姿态、口型或完整 morph retargeting。

下一步若继续 VRM 方向，应先做：

1. 将 Mirror / Empathic avatar 分别映射到两个可选模型视图，或添加 mode toggle。
2. 加入 expression smoothing，避免 preset 表情跳变。
3. 再考虑头部/身体 cue 到 VRM humanoid bones 的映射。

## 14. Avatar layout and VRM visibility adjustment

Updated layout per user request:

```text
Perception | AU Dashboard | Avatar
Feedback   | Feedback     | Data Export
```

Changes:

- `AvatarScene` moved to the right of Perception/AU Dashboard.
- `FeedbackPanel` and `ResearchExportPanel` moved to the lower row.
- Increased Avatar block height for VRM preview.
- Adjusted VRM preview camera/framing:
  - removed forced `rotation.y = Math.PI`
  - center model using bounding box
  - ground model on `box.min.y`
  - camera now looks at upper body/head area
- VRM load error now prints a more detailed status message.

## 15. Direct blendshape → VRM prototype

Added a direct low-level mirror path that bypasses AU, expression, and appraisal for avatar facial motion.

New file:

```text
src/core/avatar/directBlendshapeToVrm.ts
```

Current direct mapping:

```text
MediaPipe raw blendshapes → VRM preset expressions
```

Examples:

- `mouthSmileLeft/Right` + `cheekSquintLeft/Right` → VRM `happy`
- `eyeWideLeft/Right` + brow up + `jawOpen` → VRM `surprised`
- `browDownLeft/Right` + mouth press → VRM `angry`
- `mouthFrownLeft/Right` → VRM `sad`
- `jawOpen` → VRM `aa`
- `mouthPucker` / `mouthFunnel` → VRM `ou` / `oh`
- `eyeBlinkLeft/Right` → VRM blink presets

`VRMPreview` now prefers direct raw blendshape driving when live camera data exists. If no raw blendshapes exist, it falls back to the previous Mirror/Empathic AvatarIntent expression mapping.

A simple smoothing lerp is applied to VRM expression weights to reduce jitter.

## 16. VRM model switched to AvatarSample_C

Switched local VRM prototype from `AvatarSample_S.vrm` to `AvatarSample_C.vrm`.

Local ignored asset:

```text
public/models-local/AvatarSample_C.vrm
```

`VRMPreview.tsx` now loads:

```text
/models-local/AvatarSample_C.vrm
```

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 17. PoseLandmarker + HandLandmarker perception layer

Added MediaPipe pose and hand perception to the camera/debug pipeline.

New local model assets:

```text
public/models/pose_landmarker_lite.task
public/models/hand_landmarker.task
```

New/updated files:

```text
src/core/mediapipe/holisticLandmarkers.ts
src/components/CameraDebugger/PoseHandOverlay.tsx
src/hooks/useFaceTracking.ts
src/types/signals.ts
src/components/CameraDebugger/CameraDebugger.tsx
```

Current behavior:

- Tracking now initializes FaceLandmarker + PoseLandmarker + HandLandmarker.
- Each frame runs face, pose, and hand detection from the same video stream.
- `FaceFrame.poseHand` stores debug pose/hand landmarks.
- Camera panel overlays:
  - yellow pose skeleton / dots
  - cyan/green hand skeletons / dots
- Raw readout shows pose count and hand count.

Scope intentionally limited:

- Pose/hand data is debug-only for now.
- It does not yet drive AU, appraisal, avatar body bones, or hand bones.
- Next step should define pose/hand feature extraction before using it in appraisal or VRM retargeting.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 18. Direct pose/hand → VRM prototype

Updated pose/hand handling per user request: landmarks are no longer drawn over the video. Pose/hand signals are now used as avatar-driving inputs.

New file:

```text
src/core/avatar/directPoseHandToVrm.ts
```

Current prototype mapping:

- Pose shoulders/nose → VRM head yaw/pitch/roll proxy.
- Shoulders/hips → chest/spine lean proxy.
- Shoulders/elbows/wrists → upper/lower arm and hand rough rotations.
- Hand landmarks → coarse finger curl proxy for index/middle/ring/little fingers.

Updated:

- `VRMPreview` now receives `poseHand` from the live frame.
- `VRMPreview` applies face blendshape expression mapping and pose/hand bone mapping in the same render loop.
- Camera video no longer shows pose/hand landmark overlay.
- Camera panel still reports Pose count / Hands count in raw readout.

Scope and limitations:

- This is a rough direct retargeting prototype, not a production-grade IK solver.
- Arm/hand rotations are heuristic and may need sign/axis tuning per VRM model.
- Finger curl is coarse, not per-finger anatomical retargeting.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 19. FaceLandmarker head rotation → VRM head

Added direct head-pose extraction from FaceLandmarker facial transformation matrix.

Updated files:

```text
src/core/mediapipe/faceLandmarker.ts
src/hooks/useFaceTracking.ts
src/core/avatar/directPoseHandToVrm.ts
src/components/AvatarScene/VRMPreview.tsx
src/components/AvatarScene/AvatarScene.tsx
```

Current behavior:

- `extractHeadPose()` converts the first facial transformation matrix into yaw/pitch/roll proxy values.
- `useFaceTracking` stores this as `FaceFrame.headPose`.
- `VRMPreview` passes head pose into the direct pose/hand VRM retargeting loop.
- `directPoseHandToVrm` now prioritizes FaceLandmarker head pose for VRM head rotation.
- Pose nose/shoulder head estimation remains only as a fallback when face matrix head pose is unavailable.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 20. Avatar rest pose before/after tracking

Adjusted avatar behavior so it returns to a neutral relaxed state when tracking is not active.

Behavior:

- Before `Start tracking`, avatar has no facial expression and gradually stays/returns to rest pose.
- After `Stop tracking`, live frame data is cleared and avatar returns to rest pose.
- Rest pose target:
  - neutral face / zero expression weights
  - head forward
  - chest/spine neutral
  - arms and hands relaxed back to model default/down pose
  - fingers uncurl toward neutral

Updated files:

```text
src/core/avatar/directPoseHandToVrm.ts
src/components/AvatarScene/VRMPreview.tsx
src/store/useRealtimeFaceStore.ts
src/store/useDashboardStore.ts
src/hooks/useFaceTracking.ts
src/hooks/useNeutralCalibration.ts
```

Notes:

- `applyAvatarRestPose()` smooths humanoid bones toward zero rotation when no live face/pose/hand/head signals exist.
- `useFaceTracking.stop()` now clears realtime and dashboard frame state so stale user pose no longer keeps driving the avatar.
- Neutral calibration ignores undefined realtime frames created by clearing the live store.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 21. Arm/finger retargeting correction pass

After user testing, face/head were acceptable but arms were constantly wrong and fingers appeared unmapped. Reworked the direct pose/hand retargeting prototype.

Updated:

```text
src/core/avatar/directPoseHandToVrm.ts
src/components/AvatarScene/VRMPreview.tsx
```

Changes:

- Replaced eager full 2D arm angle retargeting with a conservative gated arm policy:
  - arms stay near rest unless wrist/elbow clearly leaves the relaxed-down region
  - upper/lower arm movement is driven mainly by wrist/shoulder lift and elbow bend
  - this avoids constant wrong arm rotations from noisy 2D landmarks
- Replaced one shared average hand curl with per-finger curl:
  - thumb: landmarks 1-2-3-4
  - index: 5-6-7-8
  - middle: 9-10-11-12
  - ring: 13-14-15-16
  - little: 17-18-19-20
- Added thumb bones to rest pose and finger mapping.
- Added compound finger curl rotation on normalized VRM finger bones for first-pass model compatibility.
- Added VRM bone diagnostics displayed in the avatar note:
  - arms `available/total`
  - fingers `available/total`

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

Next live tuning targets:

- If finger diagnostics show `fingers 0/30`, the model has no humanoid finger bindings or the loader did not expose them.
- If diagnostics show finger bones exist but finger curl still does not move, tune finger curl axes/signs.
- If arms still invert, tune only the conservative arm sign constants instead of returning to full 2D retargeting.

## 22. Kalidokit-based pose/hand retargeting pass

User reported:

- face/head mapping acceptable
- arms and fingers still wrong
- torso movement direction reversed
- requested checking pose/hand model usage and referencing `https://github.com/yeemachine/kalidokit`

Actions:

- Confirmed `PoseLandmarker` and `HandLandmarker` are initialized and used in the live loop.
- Switched pose/hand frame data to include MediaPipe `worldLandmarks` in addition to normalized landmarks.
- Updated CameraDebugger readout to show:
  - pose presence
  - whether pose world landmarks are present
  - hand count
  - how many hands have world landmarks
  - handedness labels
- Added `kalidokit` dependency.
- Replaced the hand-written torso/arm/finger heuristic retargeting with Kalidokit-style solving:
  - `Pose.solve(worldLandmarks, landmarks, { runtime: 'mediapipe', enableLegs: false })`
  - `Hand.solve(handWorldLandmarks || handLandmarks, side)`
- Torso now follows Kalidokit `Spine` mapping instead of the earlier manually inverted torso proxy.
- Hands follow Kalidokit finger rotations, with VRM 1.0 thumb name remapping:
  - Kalidokit `ThumbProximal` → VRM `ThumbMetacarpal`
  - Kalidokit `ThumbIntermediate` → VRM `ThumbProximal`
  - Kalidokit `ThumbDistal` → VRM `ThumbDistal`
- Hand side is swapped before solving, matching Kalidokit’s VRM sample for mirrored selfie input.

Updated files:

```text
package.json
package-lock.json
src/types/signals.ts
src/hooks/useFaceTracking.ts
src/core/avatar/directPoseHandToVrm.ts
src/components/CameraDebugger/CameraDebugger.tsx
```

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

Live test checklist:

- CameraDebugger should show `Pose world: yes` while body is visible.
- `Hand world` should equal detected hand count when hands are visible.
- Avatar note should still show `bones: arms 6/6 · fingers 30/30` for full VRM hand support.
- If hands are still reversed, flip the hand-side swap constant/logic in `applyKalidokitHand` and `applyKalidokitHands`.

## 23. Arm vertical axis flip for AvatarSample_C

User confirmed pose/hand debug input is correct, but avatar arms move vertically inverted.

Fix:

- Added `invertArmVertical()` in `src/core/avatar/directPoseHandToVrm.ts`.
- Flipped only arm vertical rotation (`z`) for:
  - `rightUpperArm`
  - `rightLowerArm`
  - `leftUpperArm`
  - `leftLowerArm`
- Left head, torso, hands, and fingers unchanged.

Reason:

- Kalidokit solver output is valid, but `AvatarSample_C` normalized arm vertical axis appears opposite from Kalidokit’s reference VRM setup.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 24. Finger neutral pose and palm/back diagnostics

User reported:

- arms improved
- fingers still strange
- open/natural hand should not lift fingers
- system seems not to recognize palm vs back of hand

Actions:

- Added `src/core/mediapipe/handFeatures.ts`.
- Added diagnostic hand features:
  - `palmFacing(hand)` → `palm | back | side | unknown` proxy from hand world landmark palm normal
  - `handOpenness(hand)` → 0..1 openness proxy from finger joint curls
- CameraDebugger hand label now shows:

```text
Left:palm:0.92 / Right:back:0.88
```

- Kept Kalidokit for wrist orientation only.
- Disabled Kalidokit finger rotations for this VRM because its default finger offsets made relaxed open fingers appear lifted.
- Replaced finger driving with a custom curl-only mapper:
  - open hand + curl below deadband → exact rest quaternion
  - only curls fingers away from rest when finger joint angles indicate real bending
  - thumb/index/middle/ring/little are mapped separately

Updated files:

```text
src/core/mediapipe/handFeatures.ts
src/core/avatar/directPoseHandToVrm.ts
src/components/CameraDebugger/CameraDebugger.tsx
```

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

Caveat:

- Palm/back is inferred from world-landmark palm normal. MediaPipe HandLandmarker does not provide a direct semantic palm/back class, so this is a diagnostic proxy and its sign may need flipping depending on camera/model coordinates.

## 25. Right-hand palm/back correction and fist proxy

User reported right-hand palm/back classification was reversed and requested fist recognition.

Changes:

- Corrected palm/back proxy by flipping palm-normal sign for `hand.handedness === 'Right'` only.
- Added `handGesture()` in `src/core/mediapipe/handFeatures.ts`:
  - `fist` when index/middle/ring/little average curl is high and all four fingers are curled
  - `open` when four-finger curl is low and thumb curl is low
  - otherwise `relaxed`
- CameraDebugger hand labels now show:

```text
Right:palm:fist:0.18
Left:back:open:0.94
```

Format:

```text
handedness:palm/back/side:gesture:openness
```

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

## 26. Gesture-aware avatar hand poses

User confirmed debug is correct and face/head/body are good, but avatar fingers cannot flexibly show full gestures such as fist or V sign.

Changes:

- Extended hand gesture recognition:
  - `fist`
  - `victory` (V sign)
  - `open`
  - `relaxed`
  - `unknown`
- Added `gestureCurls()` to convert recognized gestures into explicit target finger curls:
  - fist → all four fingers fully curled, thumb partially curled
  - victory → index/middle open, ring/little curled, thumb partially curled
  - open → all fingers at rest
  - relaxed → continuous curl values from landmarks
- Reworked avatar finger retargeting to use gesture-aware curls instead of raw continuous curls only.
- Increased visible finger articulation using compound x+z bend per finger segment while preserving exact rest for open hand.

Updated files:

```text
src/core/mediapipe/handFeatures.ts
src/core/avatar/directPoseHandToVrm.ts
```

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.

Live test expectations:

- Debug label should show `victory` for V sign.
- Avatar should show V by keeping index/middle open and curling ring/little.
- Avatar should show fist by curling all four fingers.
- Open hand should return fingers to exact rest, avoiding upward lifted fingers.

## 27. Manual finger axis test panel

Added an Avatar-side finger calibration/testing panel so AvatarSample_C finger bone axes can be tested independently of MediaPipe recognition.

New files:

```text
src/core/avatar/fingerTestPose.ts
src/components/AvatarScene/FingerTestPanel.tsx
```

Updated:

```text
src/core/avatar/directPoseHandToVrm.ts
src/components/AvatarScene/VRMPreview.tsx
src/components/AvatarScene/AvatarScene.tsx
src/styles/app.css
```

Behavior:

- Avatar panel now includes `Finger axis test` controls.
- `override hand pose` bypasses live pose/hand retargeting for hand/finger test poses.
- Test controls:
  - gesture: none/open/fist/victory/index/middle/ring/little/thumb
  - side: Both/Left/Right
  - axis: x/y/z/xz/yz
  - sign: +1/-1
  - gain: 0..2
- `VRMPreview` applies `applyFingerTestPose()` before live pose/hand retargeting. If test override is enabled, it uses manual target curls.

Purpose:

- Identify which local finger axis/sign/gain makes AvatarSample_C show clear fist, V sign, and isolated finger curl.
- Once the best axis/sign/gain is found, fold it back into the automatic hand gesture mapper.

Verification:

```bash
npm run smoke:core
npm run build
```

Both pass.
