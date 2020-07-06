const log = require("./log");

// 选用该种数据结构是为了：
// 1. 接入其他指令时可新增一种 key
// 2. 该种 key 下，多种不同维度的 option 的互斥
const exclusiveGroups = {
  init: {
    tpls: ["web", "h5", "node"]
  }
};
// 需要对话层接入的 option
// 针对输入快捷方式如：-H 的使用情况
const needInq = ["h5", "web"];

/**
 * 参数互斥校验
 * @param {object} options - 传入的参数
 * @param {string} command - 输入的指令
 * @returns {any[]} true 互斥，false 不互斥
 */
function isExclusion(options, command) {
  let optKeys = Object.keys(options);
  if (command == "init") {
    // 输入的模板数放置于此数组
    let tpls = [];
    for (let i = 0; i < optKeys.length; i++) {
      // 模板参数互斥
      if (exclusiveGroups[command]["tpls"].includes(optKeys[i])) {
        tpls.push(optKeys[i]);
      }
    }
    if (tpls.length <= 1) {
      return [false, tpls];
    } else {
      return [true];
    }
  }
}

function isNeedShowInquirer(options, command) {
  let [isReject, resultArr] = isExclusion(options, command);
  if (isReject) {
    log("");
    log.red("仅支持选择一种模板");
    process.exit(1);
  } else {
    return resultArr.length === 0 || needInq.includes(resultArr[0])
      ? [true, resultArr]
      : [false, resultArr];
  }
}

module.exports = {
  isNeedShowInquirer
};
