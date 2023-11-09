/**
 * YApi平台的各个api调用
 */
// 引入别名路径包，因为tsc不支持编译别名路径，故此需要这个包进行路径转换。
const chalk = require('chalk'); // 修改console.chalk的文字效果
import axios from "axios";
const instance = axios.create({
    baseURL: 'https://yapi.inkept.cn/',
    timeout: 5000,
});
instance.interceptors.response.use((res) => {
    return res;
}, (error) => {
    chalk.red('接口权限有问题！请检查当前token是否有访问该接口的权限！')
    return Promise.reject(error);
})
// 获取某个分类下接口列表 https://hellosean1025.github.io/yapi/openapi.html
export function interfaceListCat(params: YapiQueryListCat): Promise<YapiResponseListCat> {
    return instance.request({
        url: '/api/interface/list_cat',
        method: 'GET', // default
        params
    })
}

// 获取接口数据（有详细接口数据定义文档） https://hellosean1025.github.io/yapi/openapi.html
export function interfaceGet(params: YapiQueryGet): Promise<YapiResponseGet> {
    return instance.request({
        url: '/api/interface/get',
        method: 'GET', // default
        params
    })
}