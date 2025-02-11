const gulp = require('gulp');

// `build` 函数被导出（export）了，因此它是一个公开任务（public task），并且可以被 `gulp` 命令直接调用。
// 它也仍然可以被用在 `series()` 组合中。
function build(cb) {
  // body omitted
  cb();
}

const rollup = require("gulp-better-rollup");
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('rollup-plugin-babel')
const terser = require('rollup-plugin-terser')
function treeShaking(cb) {
  const rollupInputOtions = {
    // input: './src/pages/index.js', // 在gulp中 只能支持一个自定义入口
    // input: {
    //     main: './src/pages/index1.js',  // 入口文件 1
    //     about: './src/pages/index2.js',  // 入口文件 2
    // },
    plugins: [babel(), commonjs()],
    treeshake: true,  // 启用 Tree Shaking
    external: ['lodash']  // 排除 lodash，不打包到最终输出中
  };
  const rollupOutpitOtions = {
    format: 'esm',  // 输出 ES 模块格式
    // dir: 'dist',     // 输出目录 gollup 无效
    chunkFileNames: 'common/[name].js', // 提取的共享代码块生成带哈希值的文件名
    entryFileNames: '[name].[hash].js',
  };


  return gulp.src('./src/pages/**/*')
  .pipe(rollup(rollupInputOtions, rollupOutpitOtions))
  .pipe(gulp.dest('dist'))
}

const clean = require('gulp-clean')
function cleanDist(cb) {
  return gulp.src('./dist')
  .pipe(clean())
} 

var gulpCopy = require('gulp-copy');

function copywxml() {
  return gulp.src('src/**/*.wxml')
  .pipe(gulpCopy('dist', { prefix: 1 }))
}

function copywxss() {
  return gulp.src('src/**/*.wxss')
  .pipe(gulpCopy('dist', { prefix: 1 }))
}

function copyjson() {
  return gulp.src('src/**/*.json')
  .pipe(gulpCopy('dist', { prefix: 1 }))
}
exports.build = build;
exports.default = gulp.series(cleanDist, copywxml, copywxss);