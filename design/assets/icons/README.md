# RidePilot SVG 图标

打开 [图标预览](index.html) 查看全部 51 个独立 SVG。图标基于现有 H01、T01、N01、A01、M01 页面及训练编辑流程整理。

## 使用规则

- 产品图标为 `24 × 24`、`1.8` 描边、圆角端点与圆角转折。放在至少 `44 × 44` 的点击区域内。
- 普通图标默认柔灰 `#ADB2AA`；五栏导航的 `nav-*-active.svg` 为香槟金 `#D2C18F`。同一个导航项只切换图标颜色，不更换图形。
- SVG 根节点使用 `color` 和 `currentColor`。作为内联 SVG 时可覆盖根节点的 `color`；作为 `<img>` 使用时引用对应颜色文件，或使用 CSS mask 着色。
- `status-*` 是当前设计稿中的系统状态栏示意图标；原生应用应由系统状态栏绘制。
- `warning.svg`、`info.svg`、`check.svg` 只提供图形，状态提示仍需配文字；颜色不能单独承担风险含义。
- 训练功率曲线和阶段进度依赖真实数据，应由图表组件绘制，不使用固定 SVG 图标替代。

## 文件对应

| 使用场景 | 文件 |
| --- | --- |
| 底部五栏 | `nav-home`、`nav-training`、`nav-nutrition`、`nav-coach`、`nav-profile`；均有 `-active` 选中态 |
| 训练页与 AI 快捷调整 | `history`、`clock`、`heart-rate`、`weather`、`calendar`、`calendar-test`、`race-flag`、`time-short`、`fatigue`、`intensity` |
| 草稿、预览、应用与恢复 | `plan-draft`、`workout-profile`、`compare`、`save`、`restore` |
| 饮食与个人资料 | `meal`、`profile`、`settings`、`body-profile`、`records`、`privacy`、`privacy-verified`、`device` |
| 通用操作与状态 | `chevron-*`、`arrow-*`、`plus`、`minus`、`check`、`close`、`warning`、`info`、`edit`、`more`、`status-unknown` |

运行 `python3 design/assets/icons/build-icons.py` 可从源定义重新生成 SVG 和预览页。
