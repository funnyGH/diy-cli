// init 时，选择 web 类型，弹出的模块选项配置列表
// TODO: 这里低版本的node会导致message一直出现，但是我不想做这种兼容的hack处理...

/**
 * @param {string[]} template - 模板参数
 * @returns {any[]} - 注入对话数组
 */
function initModules(template) {
  return [
    // h5 模块
    {
      type: "checkbox",
      name: "modules",
      prefix: "✨",
      message: "请选择您要使用的模块:",
      choices: [
        {
          name: "vant模块",
          value: "vant"
        },
        {
          name: "vuex模块",
          value: "vuex"
        },
        {
          name: "subpage模块 (老项目迁移不方便修改原路由时使用)",
          value: "subpage"
        },
        {
          name: "神策系统埋点模块 (模块较大，谨慎选择)",
          value: "sensorsData"
        },
      ],
      when(preAnswer) {
        return when1({
          preAnswer,
          type: 'projectType',
          template,
          who:'h5'
        })
      }
    },

    // web 模块
    {
      type: "input",
      name: "systemName",
      prefix: "✨",
      message: "请输入当前系统/后台名称:",
      default: "项目名称",
      validate(input){
        return input ? true : "请输入当前系统/后台名称"
      },
      when(preAnswer) {
        return when1({
          preAnswer,
          type: 'projectType',
          template,
          who:'web'
        })
      }
    },
    {
      type: "checkbox",
      name: "modules",
      prefix: "✨",
      message: "请选择您要使用的模块:",
      choices: [
        {
          name: "顶部导航模块",
          value: "topNav"
        },
        // {
        //   name: "侧边栏导航模块",
        //   value: "sideNav"
        // }
      ],
      when(preAnswer) {
        return when1({
          preAnswer,
          type: 'projectType',
          template,
          who:'web'
        })
      }
    },

  ];
}

/**
 * 动态注入下一层级的对话视图
 * @param {Object} info - 入参对象
 * @param {Object} info.preAnswer - 之前的答案
 * @param {string} info.type - 答案键
 * @param {Array} info.template - 入参数组
 * @param {string} info.who - 期望值
 */
function when1({ preAnswer = {}, type = "", template = [], who = "" }) {
  return preAnswer[type] === who || template.includes(who);
}

module.exports = initModules;
