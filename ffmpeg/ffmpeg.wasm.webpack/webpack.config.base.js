const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const packageJson = require('./package.json');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    entry: path.resolve(__dirname, './src/main'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: process.env.publicPath,
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/ // 不编译node_modules下的文件
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader',
                    {
                        loader: 'style-resources-loader',
                        options: {
                            patterns: path.resolve(__dirname, './src/style/variables.less'),
                            injector: 'append'
                        }
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        // 将node的环境变量注入到浏览器的环境变量中
        new DefinePlugin({
            'process.env.DOMAIN': JSON.stringify(process.env.DOMAIN),
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './index.html'),
            title:packageJson.pageInfo.title,
            backgroundColor:packageJson.pageInfo.backgroundColor,
            script1:`<script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>`,
            script2:`<script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>`,
        }),
        new CopyPlugin({
            patterns: [
              { from: "public", to: "." }, // 将public里面的文件也打包进dist文件夹
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.tsx','.jsx','.ts', '.js'],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, './dist'),
        },
        compress: true,
        port: 9000,
    },
    externals:{
        'react':'React',
    }
}

