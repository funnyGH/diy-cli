const download = require("download-git-repo");
const repoConf = require("../../config/repo.conf.js");
const { mkdir, rmkdir, rootPath } = require("./helper");
const log = require("./log");

function repoAddress(projectType) {
  let info = repoConf[projectType];
  return `${info["repoOrigin"]}:${info["hostname"]}:${info["templateAddress"]}${
    info["branch"] ? `#${info["branch"]}` : ""
  }`;
}

/**
 * download(repository, destination, options, callback)
 * Download a git repository to a destination folder with options, and callback.
 */
async function downloadRepo({ name, projectType, options }) {
  mkdir(name);
  // TODO: 断网时
  if (options.offline) {
    rmkdir(name);
    log.red('您的网络连接出现异常，请确认后重新拉取项目～');
  } else {
    return new Promise((res, _) => {
      download(
        repoAddress(projectType),
        rootPath(name),
        { clone: true },
        (err) => {
          if (err) {
            log.red(String(err));
            process.exit(1);
          }
          log(`Clone has been done.`);
          res()
        });
    });
  }
}

module.exports = downloadRepo;
