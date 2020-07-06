// 模块处理函数
const { rmFiles, editFile, readfile, writFile } = require("./helper");
const path = require("path");
const eventsBus = require("./eventsBus");

/**
 * 不需要的模块的处理函数
 * @param {string} rootPath - 项目绝对路径
 * @param {any} modulesMeta - 模块元信息
 * @param {any} operInfo - 脚手架配置信息
 */
function editModules(rootPath, modulesMeta, operInfo) {
  let allDelFiles = [];
  let allPkgs = [];

  // 1. 所有不需要使用的模块的信息整合
  (operInfo.modules || []).forEach(item => {
    if (modulesMeta[item.name] === false) {
      allDelFiles.push(...item.deleteFile);
      allPkgs.push(...item.pkgs);
    }
  });

  // 2. 操作package.json
  readfile(path.join(rootPath, "package.json")).then(r => {
    let jsn = JSON.parse(r);
    allPkgs.forEach(pkg => {
      Reflect.deleteProperty(jsn.dependencies, pkg);
      Reflect.deleteProperty(jsn.devDependencies, pkg);
    });
    writFile(path.join(rootPath, "package.json"), JSON.stringify(jsn, null, 2));
    // // 将install放入下一个事件循环里，因为需要先on，再emit，才能触发事件监听
    eventsBus.emit("install");
  });

  // 3. 编辑配置文件标注的文件
  replceFc(rootPath, modulesMeta, operInfo.needEditFile);

  // 4. 删除
  rmFiles(allDelFiles.map(p => path.join(rootPath, p)));
}

/**
 * 删除注释函数
 * @param {string} c - 内容区域
 */
function delComment(c) {
  let reg = /\/\*\s*diycli|diycli\s*\*\/|\<!--\s*diycli|diycli\s*--\>/g;
  return c.replace(reg, "");
}

/**
 * 替换占位符函数
 * @param {string} rootPath - 项目目录
 * @param {any} mate - 提供编辑文件的元数据
 * @param {string[]} filePathArr - 文件路径数组
 */
function replceFc(rootPath, mate, filePathArr) {
  filePathArr.forEach(filePath => {
    filePath = path.join(rootPath, filePath);
    readfile(filePath).then(
      res => {
        writFile(filePath, editFile(res, mate, delComment));
      },
      _ => {}
    );
  });
}

module.exports = editModules;
