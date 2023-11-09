const inquirer = require('inquirer')        //弹出交互选项，询问用户要创建的项目需要哪些功能
const chalk = require('chalk'); // 修改console.log的文字效果
const main = async () => {
    let inputData = (await inquirer.prompt([
        {
            type: "input",
            message: "请输入项目token",
            name: "token",
            validate: function (val: string) {
                if (val.trim().length == 0) {
                    chalk.red('\n不允许为空');
                    return false;
                }
                return true;
            },
            default: '',
        },
    ]));
    console.log('inputData', inputData)
}