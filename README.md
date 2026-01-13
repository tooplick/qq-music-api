# QQ Music API

基于 Cloudflare Pages + D1 数据库的 QQ 音乐 API 服务。

## 🚀 部署 (Cloudflare Dashboard)

### 1. Fork 并连接仓库

1. Fork 此仓库到你的 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Workers & Pages** > **Create** > **Pages**
4. 选择 **Connect to Git** > 选择你 Fork 的仓库
5. 点击 **Save and Deploy**

### 2. 创建 D1 数据库

1. 进入 **D1** > **Create database**
2. 名称填写: `qqmusic-credentials`
3. 复制创建后的 **Database ID**

### 3. 绑定数据库

1. 进入 Pages 项目 > **Settings** > **Functions** > **D1 database bindings**
2. 添加绑定:
   - Variable name: `DB`
   - D1 database: 选择 `qqmusic-credentials`

### 4. 设置凭证

1. 进入 **Settings** > **Environment variables**
2. 添加变量:
   - Name: `INITIAL_CREDENTIAL`
   - Value: (粘贴你的凭证 JSON)
   - 勾选 **Encrypt**

3. 重新部署项目

### 5. 完成 ✅

首次访问任意 API 端点时，会自动创建表并初始化凭证。

---

## 📖 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/search?keyword=xxx` | GET | 搜索歌曲/歌手/专辑/歌单 |
| `/api/song/url?mid=xxx` | GET | 获取歌曲播放链接 |
| `/api/song/detail?mid=xxx` | GET | 获取歌曲详情 |
| `/api/lyric?mid=xxx` | GET | 获取歌词 |
| `/api/album?mid=xxx` | GET | 获取专辑详情 |
| `/api/playlist?id=xxx` | GET | 获取歌单详情 |
| `/api/singer?mid=xxx` | GET | 获取歌手信息 |
| `/api/top` | GET | 获取排行榜 |
| `/api/credential` | GET | 获取凭证状态 |
| `/api/refresh` | POST | 刷新凭证 |

---

## ⚠️ 免责声明

本项目仅供学习参考，禁止用于商业用途。请尊重版权，支持正版音乐。