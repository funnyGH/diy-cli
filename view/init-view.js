// init操作的视图层
const inquirer = require("inquirer");
const initModules = require("./modules/init-modules");

/**
 * @param {string[]} template - 需要注册的对话列表([] 或者是含有i的指令)
 */
async function initTplView(template) {
  let base = [
    {
      type: "list",
      name: "projectType",
      prefix: "✨",
      message: "模板类型:",
      choices: [
        {
          name: "h5",
          value: "h5"
        },
        {
          name: "web",
          value: "web"
        },
        // {
        //   name: "node",
        //   value: "node"
        // }
      ],
      when() {
        return template.length === 0
      }
    }
  ];

  let promptList = base.concat(initModules(template));
  return inquirer.prompt(promptList);
}

module.exports = {
  initTplView
};
