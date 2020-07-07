const log = require("./log");
const execa = require("execa");
const ora = require("ora");
const chalk = require("chalk");
const semver = require("semver");
const readline = require("readline");
const currentVersion = require("../../package.json").version;

/**
 * 脚手架版本检查
 * @param {string} cliName - cli名字
 * 必须要上传到npm后才能做版本对比，本地link没有版本对比
 */
async function cliVersionCheck(cliName = "") {
  let { stdout, error } = await execa("npm", [`show ${cliName} version`], {
    shell: true,
    timeout: 5000
  }).then(
    r => {
      return { stdout: r.stdout, error: false };
    },
    e => {
      return { stdout: undefined, error: true };
    }
  );

  if (!error) {
    if (semver.lt(currentVersion, stdout)) {
      log(`📦 脚手架当前版本：${chalk.red(currentVersion)}`, false);
      log(`   最新版本：${chalk.green(stdout)}`, false);

      let result = '';
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '   是否现在更新？yes/no',
      });

      rl.prompt();
      rl.on('line', (line) => {
        result = line.trim();
        rl.close();
      }).on('close', async () => {
        if (result === 'yes') {
          const spinner = ora(` 正在升级 ${cliName}`);
          spinner.start();
          // 使用 update 只能更新小版本，出现中版本更新就获取不到
          await execa('npm', [`i ${cliName} -g`], {
            shell: true
          }).then(
            r => {
              spinner.succeed();
            },
            e => {
              spinner.fail();
            }
          );
        } else {
          // FIXME: 如果不是强制升级，就不用关闭进程
          // process.exit(0);
        }
      });
    } else {
      log(`📦 脚手架当前版本：${chalk.green(currentVersion)}`, false);
    }
  }
}

/**
 * 模板的依赖检查
 * @param {object} pkgName - 当前项目包对象
 * @param {string} name - 项目路径
 */
function npmPckVersion(pkgName, name) {
  const spinner = ora(` 正在进行核心依赖检查...`);
  spinner.start();
  let keys = Object.keys(pkgName);
  // 已更新的依赖的数量
  let updated = 0;
  // 需要更新的依赖的数量
  let needUpdate = 0;
  let notNeedUpdate = keys.length;
  // 已检查的依赖的数量
  let checked = 0;
  keys.forEach(key => {
    execa("npm", [`show ${key} version`], {
      shell: true
    }).then(res => {
      spinner.succeed(` 核心依赖(${key})检查完毕`);
      spinner.stop();
      if (res.stdout !== pkgName[key]) {
        needUpdate = keys.length - --notNeedUpdate;
        log(` ${key}:`);
        log(` 当前:  ${chalk.yellow(pkgName[key])}`);
        log(` 最新:  ${chalk.green(res.stdout)}`);
        execa(
          "sh",
          [`${__dirname}/../../sh/start-update.sh ${name} ${key}`],
          {
            shell: true,
            stdio: "inherit"
          }
        ).then(r => {
          if (r.stdout == null) {
            updated++;
          }
          if (updated === needUpdate) {
            log();
            log.green(`核心依赖已全部更新`, false);
            eventsBus.emit("allUpdated");
          }
        }).catch(e => {
          log("升级核心依赖失败");
        });
      } else {
        if (++checked === notNeedUpdate) {
          log();
          log.green("核心依赖已是最新", false);
          eventsBus.emit("allUpdated");
        }
      }
    }).catch(e => {
      log("依赖名错误");
    });
  });
}

module.exports = {
  cliVersionCheck,
  npmPckVersion
};
