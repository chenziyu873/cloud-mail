<p align="center">
  <img src="doc/demo/logo.png" width="80px" />
</p>

<div align="center">
<h1>Cloud Mail</h1>
</div>
<div align="center">
    <h4>基于 Cloudflare 的简约响应式邮箱服务，支持邮件发送、附件收发 🎉</h4> 
</div>
<div align="center">
    <span>简体中文 | <a href="/README-en.md" style="margin-left: 5px">English </a></span>
</div>

## 项目简介

只需要一个域名，就可以创建多个不同的邮箱，类似各大邮箱平台，本项目支持署到 Cloudflare Workers ，降低服务器成本，搭建自己的邮箱服务

## 项目展示

- [在线演示](https://skymail.ink)<br>
- [部署文档](https://doc.skymail.ink)<br>
- [界面部署](https://doc.skymail.ink/guide/via-ui.html)

| ![](/doc/demo/demo1.png) | ![](/doc/demo/demo2.png) |
|-----------------------|-----------------------|
| ![](/doc/demo/demo3.png) | ![](/doc/demo/demo4.png) |




## 🚀 本 Fork 增强功能 (Enhanced Features)

本项目在原版基础上深度定制了**高效邮件号池与自动化营销系统**：

- **📧 智能邮箱号池**：支持批量生成带有随机后缀的内部号池账号，独立管理，不干扰普通用户。
- **🎯 目标用户矩阵**：支持从 TXT/JSON 文件一键导入万级外部联系人（如 QQ、Gmail 列表）。
- **🔥 自动化批量群发**：
  - 基于 `(发件号, 收件人)` 的物理级去重，严格保证“一号一目标仅联系一次”。
  - 高性能分片发送架构，轻松驾驭数千封邮件任务。
  - 支持多轮追加发送，自动利用号池新账号接力。

## 🛠️ 更新/安装额外操作 (Required Actions)

> [!IMPORTANT]
> 由于引入了号池与日志追踪，**必须**在 Cloudflare D1 控制台执行以下 DDL 初始化数据库：
> ```sql
> -- 1. 扩展原始号池标识
> ALTER TABLE account ADD COLUMN is_pool INTEGER DEFAULT 0 NOT NULL;
> -- 2. 创建目标用户表
> CREATE TABLE target_user (target_user_id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, user_id INTEGER NOT NULL, create_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
> -- 3. 创建发送日志表
> CREATE TABLE send_log (send_log_id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, target_user_id INTEGER NOT NULL, user_id INTEGER NOT NULL, status INTEGER DEFAULT 0 NOT NULL, error TEXT, create_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
> CREATE UNIQUE INDEX unique_account_target ON send_log(account_id, target_user_id);
> ```

---

## 功能介绍

- **💰 低成本使用**： 可部署到 Cloudflare Workers 降低服务器成本

- **💻 响应式设计**：响应式布局自动适配PC和大部分手机端浏览器

- **📧 邮件发送**：集成Resend发送邮件，支持群发，内嵌图片和附件发送，发送状态查看

- **🛡️ 管理员功能**：可以对用户，邮件进行管理，RABC权限控制对功能及使用资源限制

- **📦 附件收发**：支持收发附件，使用R2对象存储保存和下载文件

- **🔔 邮件推送**：接收邮件后可以转发到TG机器人或其他服务商邮箱

- **📡 开放API**：支持使用API批量生成用户，多条件查询邮件 

- **📈 数据可视化**：使用Echarts对系统数据详情，用户邮件增长可视化显示

- **🎨 个性化设置**：可以自定义网站标题，登录背景，透明度

- **🤖 人机验证**：集成Turnstile人机验证，防止人机批量注册

- **📜 更多功能**：正在开发中...



## 技术栈

- **Serverless**：[Cloudflare Workers](https://developers.cloudflare.com/workers/)

- **Web框架**：[Hono](https://hono.dev/)

- **ORM：**[Drizzle](https://orm.drizzle.team/)

- **前端框架**：[Vue3](https://vuejs.org/) 

- **UI框架**：[Element Plus](https://element-plus.org/) 

- **邮件推送：** [Resend](https://resend.com/)

- **缓存**：[Cloudflare KV](https://developers.cloudflare.com/kv/)

- **数据库**：[Cloudflare D1](https://developers.cloudflare.com/d1/)

- **文件存储**：[Cloudflare R2](https://developers.cloudflare.com/r2/)

## 目录结构

```
cloud-mail
├── mail-worker				    # worker后端项目
│   ├── src                  
│   │   ├── api	 			    # api接口层			
│   │   ├── const  			    # 项目常量
│   │   ├── dao                 # 数据访问层
│   │   ├── email			    # 邮件处理接收
│   │   ├── entity			    # 数据库实体
│   │   ├── error			    # 自定义异常
│   │   ├── hono			    # web框架配置、拦截器、全局异常等
│   │   ├── i18n			    # 语言国际化
│   │   ├── init			    # 数据库缓存初始化
│   │   ├── model			    # 响应体数据封装
│   │   ├── security			# 身份权限认证
│   │   ├── service			    # 业务服务层
│   │   ├── template			# 消息模板
│   │   ├── utils			    # 工具类
│   │   └── index.js			# 入口文件
│   ├── pageckge.json			# 项目依赖
│   └── wrangler.toml			# 项目配置
│
├── mail-vue				    # vue前端项目
│   ├── src
│   │   ├── axios 			    # axios配置
│   │   ├── components			# 自定义组件
│   │   ├── echarts			    # echarts组件导入
│   │   ├── i18n			    # 语言国际化
│   │   ├── init			    # 入站初始化
│   │   ├── layout			    # 主体布局组件
│   │   ├── perm			    # 权限认证
│   │   ├── request			    # api接口
│   │   ├── router			    # 路由配置
│   │   ├── store			    # 全局状态管理
│   │   ├── utils			    # 工具类
│   │   ├── views			    # 页面组件
│   │   ├── app.vue			    # 入口组件
│   │   ├── main.js			    # 入口js
│   │   └── style.css			# 全局css
│   ├── package.json			# 项目依赖
└── └── env.release				# 项目配置
```

## 赞助

<a href="https://doc.skymail.ink/support.html" >
<img width="170px" src="./doc/images/support.png" alt="">
</a>

## 许可证

本项目采用 [MIT](LICENSE) 许可证	


## 交流

[Telegram](https://t.me/cloud_mail_tg)



