const { merge } = require('webpack-merge');
const webpackBase = require('./webpack.config.base.js');
module.exports = merge(webpackBase, {
    mode: 'production',
})
