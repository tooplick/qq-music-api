# QQ Music API

基于 Cloudflare Workers + D1 数据库的 QQ 音乐 API 服务。

## 🚀 部署 (Cloudflare Dashboard)

### 1. Fork 仓库

Fork 此仓库到你的 GitHub 账户。

### 2. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **D1 SQL Database** > **Create database**
3. 名称填写: `qq-music-api`
4. 复制 **Database ID**，填入 `wrangler.toml`

### 3. 创建 Worker

1. 进入 **Workers & Pages** > **Create**
2. 选择 **Create Worker**
3. 名称填写: `qq-music-api`
4. 点击 **Deploy**

### 4. 连接 Git 仓库

1. 进入刚创建的 Worker > **Settings** > **Build** > **Connect Git repository**
2. 选择你 Fork 的仓库
3. Build command 留空
4. 点击 **Save and Deploy**

### 5. 绑定 D1 数据库

1. 进入 **Settings** > **Bindings** > **Add**
2. 选择 **D1 database**
3. Variable name: `DB`
4. Database: 选择 `qq-music-api`
5. 点击 **Save**

### 6. 设置凭证

1. 进入 **Settings** > **Variables and Secrets** > **Add**
2. Type: **Secret**
3. Name: `INITIAL_CREDENTIAL`
4. Value: 粘贴你的凭证 JSON
5. 点击 **Save and Deploy**

### 7. 初始化

访问 `https://你的域名/admin` 初始化数据库。

---

## 📖 API 端点

| 端点 | 说明 |
|------|------|
| `/api/search?keyword=xxx` | 搜索歌曲/歌手/专辑/歌单 |
| `/api/song/url?mid=xxx` | 获取歌曲播放链接 |
| `/api/song/detail?mid=xxx` | 获取歌曲详情 |
| `/api/lyric?mid=xxx` | 获取歌词 |
| `/api/album?mid=xxx` | 获取专辑详情 |
| `/api/playlist?id=xxx` | 获取歌单详情 |
| `/api/singer?mid=xxx` | 获取歌手信息 |
| `/api/top` | 获取排行榜 |
| `/admin` | 管理页面 |

---

## ⚠️ 免责声明

本项目仅供学习参考，禁止用于商业用途。