const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
    entry: './src/index.ts',        // 指定打包入口文件
    output: {						// 指定打包后的目录
        path: path.resolve(__dirname, 'dist'),             // 指定打包后的文件存放在这个目录
        filename: 'index.js',  				// 指定打包后的文件

    },
    target: 'node', 
    mode: 'production',             // 提供 mode 配置选项，告知 webpack 使用相应模式的内置优化。
    module: {						// 指定webpack打包时要使用的模块(node_modlues)里面的文件
        rules: [						// 指定对打包的文件使用哪个模块
            {
                test: /\.ts$/,				// 以正则表达式匹配到文件
                use: 'ts-loader',			// 对匹配到的文件使用这个模块进行打包
                exclude: /node-modules/                  // 不对正则表达式匹配到目录/文件进行打包
            }
        ]
    },
    plugins: [
    ],
    externals: [                                // 防止将某些 import 的包(package)打包到 bundle 中，而是在运行时(runtime)再去从外部获取这些扩展依赖(external dependencies)。
        nodeExternals() // 这个插件用来帮助打包时排除`node_modules`中的依赖
    ],
    resolve: {						// 用来设置哪些文件可以作为模块
        extensions: [".ts", ".js"],   			// 设置以ts和js结尾的文件可以作为模块来引用，如果没设置，运用的es6import export会报错
        alias: {
            '@': path.resolve(__dirname, './src/'),
            '@root': path.resolve(__dirname, './'),
        },
    }
}
