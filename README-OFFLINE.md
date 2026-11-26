# 离线版 / PWA 使用说明

《衣间小日子》是纯静态 H5：没有后端、没有外部 CDN、没有远程字体。所有画面都用 Canvas / SVG 在本地绘制，运行时文件约 1.6MB（其中 Pixi 约 650KB）。

这份文档说明三种打开方式、存档怎么带走，以及 iOS / 微信里哪些事情做不到。

---

## 一、先构建

在仓库根目录执行（只需要 Node，零 npm 依赖）：

```bash
node tools/build-h5.mjs
```

产物：

```
dist/
  index.html               PWA / 本地服务器入口
  wardrobe-game.html       单文件离线版（约 1.6MB）
  css/ js/ assets/
  manifest.webmanifest
  sw.js
  serve.ps1
  start-server.bat         本机预览
  start-server-lan.bat     同一 Wi-Fi 下给手机玩
  README-OFFLINE.md
dist/wardrobe-game.html    ← 也可以直接发给别人
```

`dist/` 只包含运行需要的文件，不带 `tests/`、`docs/`、`_dev/`。

---

## 二、桌面：双击就能玩

**推荐发给别人：`dist/wardrobe-game.html`**

- Chrome / Edge：双击直接打开，能开始、能玩、能存档
- 单文件已内联 CSS、全部 JS、favicon；断网也能玩
- 单文件版**不注册 Service Worker**，因为 `file://` 不支持

`dist/index.html` 也可以双击打开并游玩，但 PWA 相关能力（离线缓存、安装到桌面）只有在 HTTPS / localhost 下才生效。

> macOS / Linux 同理：用 Chrome / Edge 打开 `wardrobe-game.html` 即可。
>
> Firefox 对 `file://` 下的部分 API 更严格，未作为主要验证目标；桌面优先 Chrome / Edge。

---

## 三、手机：同一 Wi-Fi + 电脑起静态服务器

适合“电脑开着，手机临时玩一下”。

### Windows

1. 双击 `dist/start-server-lan.bat`
2. 命令行会显示 `http://<你的电脑 IP>:8080/`
3. 手机连同一个 Wi-Fi，浏览器打开这个地址
4. 如果连不上，允许 PowerShell 通过 Windows 防火墙

只在本机看，用 `start-server.bat`（绑定 `127.0.0.1`）即可。

### macOS / Linux

```bash
cd dist
python3 -m http.server 8080
```

然后手机访问 `http://<电脑 IP>:8080/`。

### 限制

- 电脑必须开着，服务器不能停
- 手机和电脑必须在同一局域网
- 这是 **HTTP + 局域网 IP**，不是安全上下文：Service Worker / PWA 安装通常不可用
- 关掉页面后，只要服务器还在、手机能连上，就能再打开；但**不能真正离线**

---

## 四、PWA：一个网址，首次打开后离线

部署地址（GitHub Pages）：

```
https://cvreaderpy.github.io/wardrobe-game-h5/
```

### 安装

- **Android Chrome**：打开网址 → 菜单 → “安装应用” / “添加到主屏幕”
- **iOS Safari**：打开网址 → 分享 → “添加到主屏幕”
- **桌面 Chrome / Edge**：地址栏右侧安装图标，或菜单 → “安装衣间小日子”

### 离线

- 第一次打开会把 `index.html`、CSS、全部 JS、图标、manifest 写入 Cache Storage
- 之后断网、飞行模式也能从桌面图标打开
- 页面导航走“网络优先、缓存兜底”；静态资源走“缓存优先”
- 新版本发布后会提示“有新版本可用”，点“刷新更新”才切换；不点不会打断当前游戏

### 注意

- 必须 **HTTPS** 或 `localhost` 才能注册 Service Worker
- `file://`、局域网 `http://192.168.x.x` 都不满足条件
- 微信 / 小红书内置浏览器可能限制 Service Worker 和“添加到主屏幕”；这两个环境按**在线 H5** 使用，不承诺离线
- iOS 长期不打开时，系统可能清理网站数据（包括存档）；重要进度请导出存档

---

## 五、存档：导出 / 导入

存档默认在浏览器 `localStorage` 里，**不会跟着网页文件走**。换手机、换浏览器、清理缓存都可能丢。

标题页提供：

- **导出存档**：下载 `yijian-xiaorizi-save-YYYYMMDD.json`
- **导入存档**：选择之前导出的 JSON，校验后覆盖当前存档

导出的文件结构：

```json
{
  "app": "yijian-xiaorizi",
  "version": 16,
  "exportedAt": "2026-11-26T08:00:00.000Z",
  "state": { "...": "完整游戏状态" }
}
```

导入时会：

- 校验 `app`，拒绝其他游戏的 JSON
- 校验版本：比当前版本新会拒绝；旧版本自动走迁移（v15 → v16 等）
- 覆盖前把当前存档写入备份 key，导错了还有机会找回
- 设计款、自定义版型、32×32 印花、设计单都会保留

### 环境差异

- Chrome / Edge：`a[download]` 正常
- iOS Safari：一般可以下载到“文件”；若没有反应，会在新窗口打开存档文本，可长按 / 全选复制
- 微信 / 小红书 WebView：下载可能被拦截；建议“在浏览器打开”后再导出

### 容量

- 普通存档约 4–20KB
- 设计款带自定义 SVG 路径和 32×32 印花，单件约 1–6KB
- 浏览器 `localStorage` 通常 5MB 左右；超过 1MB 时游戏会在控制台提示
- 写入失败时会先删掉旧备份再重试；仍失败会提示「存档空间不足」，并建议导出
- 设计款很多时建议先导出存档，再清理不用的设计

---

## 六、iOS / 微信 / 小红书的真实限制

| 场景 | 结果 |
|---|---|
| iOS Safari 直接打开本地 HTML（`file://`） | 不可靠，不推荐 |
| iOS Safari 打开局域网 `http://IP:8080` | 能玩，但不能安装 / 离线 |
| iOS Safari 打开 HTTPS PWA，添加到主屏幕 | 可离线，推荐 |
| Android Chrome 打开局域网 HTTP | 能玩，不能安装 / 离线 |
| Android Chrome 打开 HTTPS PWA | 可安装、可离线 |
| 微信内置浏览器打开 HTTPS | 一般能在线玩；SW / 安装可能被限制 |
| 小红书内置浏览器 | 同上，按在线 H5 处理 |

**给手机用户的最稳路径**：发 HTTPS 链接 → 用系统浏览器打开 → 添加到主屏幕。

---

## 七、部署到 GitHub Pages

源码仓库保持 private；用一个公开的部署仓库只放构建产物。

1. `node tools/build-h5.mjs`
2. 把 `dist/` 推到公开仓库 `cvreaderpy/wardrobe-game-h5` 的 `main`
3. 仓库 Settings → Pages → Source 选 `main` / `/ (root)`
4. 访问 `https://cvreaderpy.github.io/wardrobe-game-h5/`

`manifest.webmanifest` 的 `start_url` / `scope` 都是 `"./"`，`sw.js` 的预缓存路径也都是 `"./..."`，因此部署在 `/wardrobe-game-h5/` 子路径下也能正常工作。

部署脚本见 `tools/deploy-pages.sh`（需要 `GITHUB_TOKEN` 环境变量，令牌不写入 git remote）。

---

## 八、排错

**双击后白屏**

- 换 Chrome / Edge
- 打开开发者工具看 Console
- 确认用的是 `dist/wardrobe-game.html`，不是源码目录里被改坏的 `index.html`

**PWA 不显示安装按钮**

- 必须 HTTPS 或 `localhost`
- 确认 `manifest.webmanifest` 和 `sw.js` 返回 200，不是 404
- Chrome DevTools → Application → Manifest / Service Workers 看报错

**离线打不开**

- 第一次必须联网完整加载一次
- DevTools → Application → Cache Storage 里应看到 `wardrobe-game-<hash>`
- 微信 / 小红书 WebView 可能不支持，换系统浏览器

**手机连不上局域网服务器**

- 确认手机和电脑同一 Wi-Fi（不是访客网络 / AP 隔离）
- Windows 防火墙放行 PowerShell
- 用 `ipconfig` / `ifconfig` 确认真实局域网 IP
- 公司网络可能禁止设备互访

**手机发热 / 掉帧**

- 在网址后加 `?quality=low`（会记住），纹理从最高 3× 降到 2×
- 想恢复：加 `?quality=high`
- 低端机（`deviceMemory <= 2` 或核心数 <= 2）会自动使用低画质

**存档导入失败**

- 确认文件是游戏导出的 JSON，不是手动改坏的文本
- 版本比当前游戏新会被拒绝，先升级游戏
- 文件超过 8MB 会被拒绝

---

## 九、开发命令

```bash
node tools/build-h5.mjs          # 构建 dist/ + 单文件
node tests/*.test.js             # 零依赖单元测试
```

本地预览 `dist/`：

```bash
cd dist
python3 -m http.server 8080
# 打开 http://localhost:8080/
```

`localhost` 是安全上下文，可以验证 Service Worker、离线刷新和安装提示。
