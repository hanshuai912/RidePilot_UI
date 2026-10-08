# 五栏联动原型

打开 [five-tabs-prototype.html](five-tabs-prototype.html)，点击底部导航，在首页、训练、饮食、AI 教练、我的五个页面间切换。每个页面的滚动位置会在切换后保留，URL 的 `#home`、`#training`、`#nutrition`、`#coach`、`#profile` 可直接定位页面。

本原型直接从五份独立设计稿生成，**不会覆盖原稿**：

- `H01-home.html`
- `T01-training.html`
- `N01-nutrition.html`
- `A01-ai-coach.html`
- `M01-profile.html`

另外接通了少量已有页面间入口：首页头像 → 我的、首页「查看全部」饮食 → 饮食、首页待处理建议 → AI 教练、饮食页今日训练 → 训练、AI 教练页当前训练 → 训练、AI 教练页替换餐食 → 饮食。课程详情、编辑、预览等尚未设计的深层页面保留为视觉控件，其行为见各页交接说明。

独立稿更新后，运行 `python3 design/screens/build-five-tabs.py` 即可重新生成整合原型。生成脚本将每页样式隔离，避免同名 CSS 类互相覆盖；图片仍读取 `design/assets/` 中已有素材。
