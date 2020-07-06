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


module.exports = {
  cliVersionCheck
};
