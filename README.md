# 九州：华夏文明

一个可直接部署到 GitHub Pages 的网页桌游。当前版本支持 3-7 人单机热座、AI 对手、自动计分，并预留 Firebase Realtime Database 联机房间。

公开地址：

```text
https://daqiguaipp.github.io/jiuzhou-board-game/
```

## 本地运行

推荐双击：

```text
start-game.bat
```

如果批处理被系统拦截，也可以右键 `start-game.ps1`，选择“使用 PowerShell 运行”。

手动方式：

```powershell
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/
```

页面也能直接用 `file:///` 打开，因为已经内置 `data/*-data.js` 镜像数据；但本地服务器方式更接近 GitHub Pages。

## GitHub Pages 发布

仓库：

```text
https://github.com/daqiguaipp/jiuzhou-board-game
```

Pages 设置：

1. 进入仓库 `Settings` -> `Pages`。
2. 如果使用工作流发布，Source 选择 `GitHub Actions`。
3. 如果使用分支发布，Source 选择 `Deploy from a branch`，Branch 选择 `main`，Folder 选择 `/ (root)`。
4. 保存后等待 1-3 分钟。
5. 打开 `https://daqiguaipp.github.io/jiuzhou-board-game/`。

## Firebase 联机配置

GitHub Pages 只能托管静态页面，不能保存房间状态。联机模式使用 Firebase Realtime Database 同步房间。

1. 打开 Firebase Console。
2. 创建项目，例如 `jiuzhou-board-game`。
3. 进入 `Build` -> `Realtime Database`。
4. 创建数据库，区域尽量选择离主要玩家近的位置。
5. 测试阶段可先使用开放规则：

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

6. 进入项目设置，添加 Web App。
7. 复制 Firebase 配置，填入 `firebase-config.js`：

```js
window.JIUZHOU_FIREBASE_CONFIG = {
  apiKey: "你的 apiKey",
  authDomain: "你的项目.firebaseapp.com",
  databaseURL: "https://你的项目-default-rtdb.firebaseio.com",
  projectId: "你的项目",
  storageBucket: "你的项目.appspot.com",
  messagingSenderId: "你的 sender id",
  appId: "你的 app id"
};
```

8. 提交并发布 `firebase-config.js`。
9. 打开公共网址，点击“联机房间”：房主创建房间，其他玩家输入房间码加入，房主开局。

## 快速响应说明

- 玩家操作会写入 `rooms/{roomCode}/game/selected/{playerId}`。
- 其他设备通过 Firebase Realtime Database 自动收到房间状态变化。
- 当前版本是房主结算制：所有玩家确认后，房主页面负责自动结算、传牌、同步新回合。
- 房主页面必须保持打开，浏览器标签页不要休眠。
- 所有玩家都使用同一个 GitHub Pages 公共网址，不要混用 `file:///`。
- 如果玩家主要在中国大陆，Firebase 和 Google SDK 可能受网络影响；更稳定的国内联机后续可改为 LeanCloud、国内云数据库或自建 WebSocket。

## 文件结构

```text
index.html
styles.css
app.js
firebase-config.js
data/
  cards.json
  wonderBoards.json
  cards-data.js
  wonderBoards-data.js
.github/
  workflows/
    pages.yml
```

## 当前玩法

- 三时代
- 每时代 7 张手牌，打出 6 张，最后 1 张弃置
- Age I/III 向左传牌，Age II 向右传牌
- 建造、卖牌、建设区域板三种行动
- 单机房间可把任意座位设置为真人或 AI
- 自动计算自有资源和左右邻居交易
- 自动军事结算
- 自动学术、区域板、公会、铜钱和终局总分
