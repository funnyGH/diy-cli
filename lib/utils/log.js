const chalk = require("chalk");
let colors = ["red", "green", "yellow"];
/**
 * 输出log封装
 * @param {string} msg - 展示信息
 * @param {boolean} space - 是否有两个空格
 * @returns {any}
 */
function log(msg = "", space = true) {
  space ? console.log(`  ` + msg) : console.log(msg);
}

colors.forEach((color) => {
  log[color] = (msg = "", space = true) => {
    space
      ? console.log(chalk[color](`  ` + msg))
      : console.log(chalk[color](msg));
  };
});

module.exports = log;
