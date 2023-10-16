const path = require('path');
const { merge } = require('webpack-merge');
const webpackBase = require('./webpack.config.base.js');
module.exports = merge(webpackBase, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, './dist'),
        },
        compress: true,
        port: 9000,
    },
    plugins: [
    ],
})

