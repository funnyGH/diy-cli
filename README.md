# 用node构建自定义脚手架

> diycli

## 依赖包作用

| 依赖包 | 用途 |
| -- | -- |
| ora | 下载过程久的话，可以用于显示下载中的动画效果。|
| chalk | 可以给终端的字体加上颜色 |
| execa | 子进程管理工具。本质上就是衍生一个 shell，传入的 command 字符串在该 shell 中直接处理。 |
| semver | 语义化版本规范 |
| inquirer | 一个用户与命令行交互的工具 |
| download-git-repo | Download and extract a git repository (GitHub, GitLab, Bitbucket) from node. |
| events| 事务总线监听 |
| Reflect.deleteProperty | delete a property on an object |

## 优化：
1 拦截条件前置，通过了才会获取版本更新
2 优化从git 拉代码时的等待交互，目前是无感下载
3 断网时，该怎么处理？
2 低版本的node会导致 initModules message 一直出现

TODO: 上传代码之前需要删除 私有源IP 和 gitlab 地址。
