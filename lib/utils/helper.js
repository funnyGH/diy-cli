const path = require("path");
const fs = require("fs");
const log = require("./log");
const Handlebars = require("handlebars");
const execa = require("execa");

/**
 * 检查当前路径下是否有 name 文件
 * @param {string[]} name - 文件名
 */
const isFileInCurrent = (...name) => {
  return fs.existsSync(rootPath(...name));
};

const mkdir = name => {
  fs.mkdirSync(name);
};
const rmkdir = name => {
  rmFiles([`${name}`]);
};

/**
 * 将内容写入到指定路径
 * @param {string} path - 绝对路径
 * @param {string} content - 内容
 */
const writFile = (path, content) => {
  fs.writeFileSync(path, content);
};

/**
 * 读取指定路径下的文件内容，返回 Promise
 * @param {string} path - 绝对路径
 * @returns {Promise}
 */
const readfile = path => {
  return new Promise((res, rej) => {
    fs.readFile(path, (err, data) => {
      if (err) return rej(err);
      res(data.toString());
    });
  });
};

/**
 * 编辑有占位符的文件
 * @param {string} content - 需要编译的内容
 * @param {object} meta - 占位符对应的元数据
 * @param {Function} ruleFc - content处理函数
 * @returns - 替换占位符后的文件内容
 */
const editFile = (content, meta, ruleFc = c => c) => {
  content = ruleFc(content);
  let template = Handlebars.compile(content);
  return template(meta);
};

/**
 * npm 源是否在指定 url
 * @param {string} url - 目标源
 * @returns [true/false, currentUrl]
 */
const isNpmInNet = async url => {
  let { stdout } = await execa("npm", [`config get registry`], {
    shell: true
  });
  return [String(stdout).includes(url), stdout];
};

/**
 * 获取项目绝对路径
 * @param {string[]} root - 项目相对路径
 * @returns {string} 绝对路径
 */
const rootPath = (...root) => {
  return path.resolve(process.cwd(), ...root);
};

/**
 * 移除指定路径下的文件
 * @param {string[]} paths - 移除文件数组
 */
const rmFiles = paths => {
  if (paths instanceof Array) {
    paths.forEach(pth => {
      if (fs.existsSync(pth)) {
        let stat = fs.statSync(pth);
        if(stat.isFile()){
          fs.unlinkSync(pth)
        } else if(stat.isDirectory()){
          let childFiles = fs.readdirSync(pth);
          rmFiles(
            childFiles.map(
              fileName => path.join(pth, fileName)
            )
          )
          fs.rmdirSync(pth)
        }
      } else {
        log.red(`脚手架配置文件${pth}该路径有误`);
      }
    });
  }
};

module.exports = {
  isFileInCurrent,
  mkdir,
  rmkdir,
  readfile,
  editFile,
  writFile,
  isNpmInNet,
  rootPath,
  rmFiles
};
