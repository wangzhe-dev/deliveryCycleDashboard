<!--
 * @Author: zhaijinsong
 * @Date: 2023-08-10 19:07:15
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-11-29 13:50:50
 * @Description: 平台简介
-->

## 平台简介

* 本仓库为前端技术栈 [Vue3](https://v3.cn.vuejs.org) + [Element Plus](https://element-plus.org/zh-CN) + [Vite](https://cn.vitejs.dev) 版本。

## 前端运行

```bash
# 克隆项目
git clone https://github.com/yangzongzhuan/jne-Cloud-Vue3.git

# 进入项目目录

# 安装依赖
yarn --registry=https://registry.npmmirror.com

# 启动服务
yarn dev

# 构建测试环境 yarn build:stage
# 构建生产环境 yarn build:prod
# 前端访问地址 http://localhost:80
```

## 内置功能

1.  用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2.  部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。
3.  岗位管理：配置系统用户所属担任职务。
4.  菜单管理：配置系统菜单，操作权限，按钮权限标识等。
5.  角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6.  字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7.  参数管理：对系统动态配置常用参数。
8.  通知公告：系统通知公告信息发布维护。
9.  操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
10. 登录日志：系统登录日志记录查询包含登录异常。
11. 在线用户：当前系统中活跃用户状态监控。
12. 定时任务：在线（添加、修改、删除)任务调度包含执行结果日志。
13. 代码生成：前后端代码的生成（java、html、xml、sql）支持CRUD下载 。
14. 系统接口：根据业务代码自动生成相关的api接口文档。
15. 服务监控：监视当前系统CPU、内存、磁盘、堆栈等相关信息。
16. 在线构建器：拖动表单元素生成相应的HTML代码。
17. 连接池监视：监视当前系统数据库连接池状态，可进行分析SQL找出系统性能瓶颈。

格式化标准
----
- 项目中强制使用Prettier风格作为团队格式化标准
- VsCode和WebStorm统一安装Prettier（Vscode 禁用掉其他插件如Vetur等）
- [WebStorm 配置参考](https://blog.csdn.net/qq_41996454/article/details/125043469)
- .vscode settings.json 配置  Tab Size:2
```ecmascript 6
{
    "editor.fontSize": 14,
    "editor.formatOnSave": true,
    "i18n-ally.localesPaths": [
        "public/tinymce/langs"
    ]
}
```
- prettier 配置
```ecmascript 6
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "bracketSameLine": true,
  "htmlWhitespaceSensitivity": "ignore",
  "bracketSpacing": true,
  "vueIndentScriptAndStyle": false,
  "jsxBracketSameLine": false,
  "printWidth": 100,
  "no-bracket-spacing": true
}
```