// @ts-nocheck
const semver = require("semver");
const chalk = require("chalk");
const execa = require("execa");
const log = require("./utils/log");
const eventsBus = require("./utils/eventsBus");
const downloadRepo = require("./utils/downloadRepo");
const editModules = require("./utils/editModules");
const { isNeedShowInquirer } = require("./utils/optionsCheck");
const { readfile, isNpmInNet, rootPath, rmFiles } = require("./utils/helper");
const { initTplView } = require("../view/init-view");
const { url } = require("../config/internalOrigin");

// 全量模块列表
const allModules = {
  h5: ["vant", "vuex", "subpage", "sensorsData"],
  web: ["topNav"],
};

async function init(name, options) {
  let [isShow, template] = isNeedShowInquirer(options, "init");

  let projectType = ""; // 项目类型
  let modulesMeta = {}; // 需要自定义的modules元数据
  let selectedInfo = {}; // 选中的modules
  if (isShow) {
    selectedInfo = await initTplView(template).catch((e) => {});
    projectType = selectedInfo.projectType
      ? selectedInfo.projectType
      : template[0];
    // 由于 脚手架 这边是增量选择需要哪些模块，而模板处是全量选择不需要哪些模块，所以脚手架这边需要做反向过滤
    (allModules[projectType] || []).forEach((i) => {
      modulesMeta[i] = (selectedInfo.modules || []).includes(i);
    });
  } else {
    projectType = template[0];
  }

  // 当前 npm 源检查
  let sameOrigin = await isNpmInNet(url);
  if (!sameOrigin[0]) {
    log();
    log.red(`  当前npm源处于：${sameOrigin[1]}`, false);
    log.red(`  需要npm源处于：${chalk.green(url)}`, false);
    process.exit(1);
  }

  // 去git拉项目
  log(`Cloning into '${name}'...`);
  await downloadRepo({ name, projectType, options });

  // 读取模版里的 .cliConf.json 文件，用来加载需要的模版
  readfile(rootPath(name, ".cliConf.json")).then(async (res) => {
    // 转成 js 对象，方便后续值处理
    res = JSON.parse(res);

    // 模板需要的 node 版本检查
    if (res.templateSelfNodeVersion) {
      let currentNodeVesion = process.version;
      let tplWantVersion = res.templateSelfNodeVersion;
      if (semver.lt(currentNodeVesion, tplWantVersion)) {
        log.red("ERROR：The project requires a higher version of node!");
        log(`  当前node版本：${currentNodeVesion}`, false);
        log(
          `  ${name}项目希望node版本：${chalk.green(tplWantVersion)}`,
          false
        );
        process.exit(1);
      }
    }

    /**
     * @method: 模板需要的 vue-cli 版本检查
     * @description: 
     * 1.本地没有安装vue-cli会进入err回调
     * 2.本地安装的 vue-cli 2.x 的会进入成功回调，并返回 '2.*.*'
     * 3.本地安装的 vue/cli 3.x 的会进入成功回调，并返回 '@vue/cli 3.*.*' || '@vue/cli 4.*.*'
     */
    if (res.templateSelfCliVersion) {
      await execa("vue", [`--version`], {
        shell: true,
      }).then((resp) => {
        if (resp.stdout) {
          let ov = resp.stdout;
          if (ov.indexOf('@vue/cli') > -1) {
            ov = ov.split(' ')[1];
          }
          
          ov = `v${ov}`;
          // 比较本地cli版本和模版要求的版本
          if (semver.lt(ov, res.templateSelfCliVersion)) {
            log.red("ERROR：The project requires a higher version of vue-cli!");
            log(`  当前vue-cli版本：${ov}`, false);
            log(
              `  ${name}项目希望vue-cli版本：${chalk.green(res.templateSelfCliVersion)}`,
              false
            );
            process.exit(1);
          }
        }
      }, (err) => {
        log();
        log.red(
          `ERROR：${name}项目希望vue-cli版本：${chalk.green(
            res.templateSelfCliVersion
          )}`,
          false
        );
        process.exit(1);
      });
    }

    // 通过node和vue-cli版本检查后，就自定义配置需要的模块并 install
    try {
      // 监听安装依赖，不是直接触发
      eventsBus.on("install", () => {
        execa("sh", [`${__dirname}/../sh/init.sh ${name}`], {
          shell: true,
          stdio: "inherit",
        }).then((_) => {
          log();
          log(`🌞 ${name}项目初始化完毕，祝您开发愉快~`, false);
        });
      });

      if (projectType === "web") {
        editModules(
          rootPath(name),
          {
            name,
            ...modulesMeta,
            systemFrom: String(name).toUpperCase(),
            ...selectedInfo,
          },
          res
        );
      } else {
        editModules(rootPath(name), { name, ...modulesMeta }, res);
      }
    } catch (e) {
      log();
      log.red(
        `${name} 项目下的脚手架配置文件编写有问题，请联系模板负责人进行检查更改`
      );
      rmFiles([`${name}/.cliConf.json`]);
      process.exit(1);
    }
  }, (_) => {
    log();
    log.red(
      `查找不到 ${name} 项目下的脚手架配置文件，请联系模板负责人进行检查更改`
    );
    rmFiles([`${name}/.cliConf.json`]);
  });
}

module.exports = init;
