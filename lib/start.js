const execa = require("execa");
const chalk = require("chalk");
const { isFileInCurrent } = require("./utils/helper");
const log = require("./utils/log");
const { readfile, rootPath, isNpmInNet } = require("./utils/helper");
const { npmPckVersion } = require("./utils/versionCheck");
const eventsBus = require("./utils/eventsBus");
const {url} = require("../config/internalOrigin")

module.exports = async name => {
  // 当前 npm 源检查
  let sameOrigin = await isNpmInNet(url);
  if (!sameOrigin[0]) {
    log();
    log.red(`  当前npm源处于：${sameOrigin[1]}`, false);
    log.green(`  需要npm源处于：${chalk.green(url)}`, false);
    return;
  }
  
  if (isFileInCurrent(name, "package.json")) {
    // 读取配置文件，判断是否存在该配置文件
    // 1. 不存在，则停止检查核心依赖，直接启动
    // 2. 存在，则判断是否有 needCheckedPkg 字段，有执行sh脚本检查依赖更新情况，没有则直接启动
    readfile(rootPath(name, ".cliConf.json")).then(
      async res => {
        try {
          res = JSON.parse(res);
          let { needCheckedPkg } = res;
          let { stdout } = await checkProjPkgs(name);
          stdout = JSON.parse(stdout);

          let versionMap = {};
          needCheckedPkg.forEach(pckName => {
            // 项目的依赖都是 dependencies 字段下
            let nameInfo = stdout["dependencies"][pckName];
            if (nameInfo == undefined) {
              throw new Error(`${name}项目下没有${pckName}依赖`);
            }
            versionMap[pckName] = stdout["dependencies"][pckName]["version"];
          });
          npmPckVersion(versionMap, name);
          // 通过事件总线监听所有依赖更新完毕，拆分启动到此处，解耦 npmPckVersion 函数功能
          eventsBus.on("allUpdated", () => {
            runProj(name);
          });
        } catch (e) {
          log();
          let errString = String(e)
            .toLowerCase()
            .includes("syntaxerror")
            ? `${name}项目下的脚手架配置文件已被损坏`
            : String(e).slice(7);
          log.yellow(`${errString}，本次启动跳过核心依赖检查`);
          runProj(name);
        }
      },
      _ => {
        log.yellow(
          "无法获取到脚手架配置文件(.cliConf.json)，即将跳过核心依赖检查"
        );
        runProj(name);
      }
    );
  } else {
    log.red(`🧐  找不到${name}路径下的package.json文件`, false);
  }
};

/**
 * 检查项目依赖
 * @param {string} path - 项目路径
 */
async function checkProjPkgs(path) {
  return await execa("sh", [`${__dirname}/../sh/start-check.sh ${path}`], {
    shell: true
  });
}

/**
 * 启动项目
 * @param {string} path - 项目路径
 */
function runProj(path) {
  execa("sh", [`${__dirname}/../sh/start-run.sh ${path}`], {
    shell: true,
    stdio: "inherit"
  });
}
