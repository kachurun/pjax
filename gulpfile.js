'use strict';

let gulp = require('gulp');
// let concat = require('gulp-concat');
let uglify = require('gulp-uglify');
let babel = require("gulp-babel");

let less = require('gulp-less');
let sourcemaps = require('gulp-sourcemaps');
let minifyCss = require('gulp-minify-css');
let concatCss = require('gulp-concat-css');
let inline_base64 = require('gulp-inline-base64');
let autoprefixer = require('gulp-autoprefixer');

// ----------------------------------------------------------------------------- VARIABLES
let src_js = ['./src/js/**/*.js'];
let src_css = ['./src/less/styles.less'];
let watch_css = './src/less/**/*.less';

let dir_js = './build/js';
let dir_css = './build/css';

// ----------------------------------------------------------------------------- TASKS
gulp.task('default', ['dev'], () => {
    gulp.watch(src_js, ['js-dev']);
    gulp.watch(watch_css, ['css-dev']);
});

gulp.task('dev', ['js-dev', 'css-dev']);
gulp.task('prod', ['js-prod', 'css-prod']);

// ----------------------------------------------------------------------------- JS

gulp.task('js-dev', () => {
    return gulp.src(src_js)
        .pipe(babel())
        .pipe(gulp.dest(dir_js));
});

gulp.task('js-prod', () => {
    return gulp.src(src_js)
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest(dir_js));
});

// ----------------------------------------------------------------------------- CSS
gulp.task('css-dev', () => {
    return gulp.src(src_css)
        .pipe(sourcemaps.init())
        .pipe(less().on('error', less.logError))
        .pipe(sourcemaps.write())
        .pipe(concatCss('style.css'))
        .pipe(gulp.dest(dir_css));
});

gulp.task('css-prod', () => {
    return gulp.src(src_css)
        .pipe(less().on('error', less.logError))
        .pipe(concatCss('style.css'))
        .pipe(inline_base64({
            baseDir: './assets/prod/',
            maxSize: 14 * 1024,
            debug: true
        }))
        .pipe(autoprefixer("last 2 version", "> 1%", {
            cascade: true
        }))
        .pipe(minifyCss({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest(dir_css));
});
