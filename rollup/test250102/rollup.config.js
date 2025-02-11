const path = require('path');
const commonjs = require('@rollup/plugin-commonjs');
const copy = require('rollup-plugin-copy');   // 复制非 js 文件，如 .wxml 和 .wxss
const fs = require('fs');

// 重构copy文件的存放路径。
const rebuildFileUrl = (name, extension, fullPath) => {
    const atomFullPath = fullPath.split('/') || []
    atomFullPath.shift()
    return atomFullPath.join('/')
}

function getMiniAppEntryUrls(src = 'src') {
    // 获取指定目录下所有 .js 文件的路径（包括子目录）
    function getJsFilesInDirectory(directoryPath) {
        let jsFiles = [];
      
        // 读取目录中的所有文件和子目录
        const files = fs.readdirSync(directoryPath);
      
        files.forEach(file => {
          const filePath = path.join(directoryPath, file);
          const stats = fs.statSync(filePath); // 获取文件的状态
      
          // 如果是文件并且是 .js 文件，则加入 jsFiles 数组
          if (stats.isFile() && path.extname(file) === '.js') {
            jsFiles.push(filePath);
          }
          // 如果是目录，则递归获取该目录中的 .js 文件
          else if (stats.isDirectory()) {
            jsFiles = jsFiles.concat(getJsFilesInDirectory(filePath)); // 递归
          }
        });
      
        return jsFiles;
    }
    const allJsPath = getJsFilesInDirectory(src) || []
    // 获取入口文件，判断依据是，只要当前js文件的含有同名json文件，说明是微信组件或者微信页面，需要作为入口文件。
    const filterJaPaths = allJsPath.filter(( path ) => fs.existsSync(`${path.split('.')[0]}.json`))
    return filterJaPaths
}

const entryDir = 'src'
const outDir = 'dist'
module.exports = {
    input: getMiniAppEntryUrls(entryDir),
    output: {
        format: 'esm',           // 小程序的脚本文件使用 ES 模块
        dir: outDir,             // 输出目录
         // 保留原来的文件结构，这么做的话，代码就不会被抽离出来到某个文件里面
        preserveModules: true, 
        preserveModulesRoot: entryDir,
    },
    external: [ // 告诉 rollup.js 哪些是外部的类库，不需要处理
        'querystringify',
        'eventemitter3', 
        '@tencent/mini-stores',
        '@tencent/oceanus-miniprogram',
        '@tencent/universal-report-mp',
        '@tencent/aegis-mp-sdk-v2',
        '@tencent/qq-guild-emoji',
        'humps',
        'miniprogram-computed'
    ],
    plugins: [
        commonjs(), // 转换 CommonJS 模块 为 es6模块， 前提条件是： 你是用 es6的方式 去导 commonjs模块，它才会工作。比如 const fn = require('../utils/index2') ==》 import fn from '../utils/index2' 其中 _virtual来源于 import CommonJS 模块 
        copy({
            targets: [
                { src: `${entryDir}/**/*.wxml`, dest: `${outDir}/`, rename:rebuildFileUrl},  // 复制 .wxml 文件 文件需要加rename
                { src: `${entryDir}/**/*.wxss`, dest: `${outDir}/`, rename:rebuildFileUrl},  // 复制 .wxss 文件
                { src: `${entryDir}/**/*.json`, dest: `${outDir}/`, rename:rebuildFileUrl},  // 复制 .json 文件
                { src: `${entryDir}/miniprogram_npm`, dest: `${outDir}/` },
                { src: `${entryDir}/image`, dest: `${outDir}/` },
                { src: `${entryDir}/utils/turingSdk/turingSDK.js`, dest: `${outDir}/`, rename:rebuildFileUrl},
            ]
        }),
    ],
};