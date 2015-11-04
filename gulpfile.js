var gulp = require('gulp');
var ngAnnotate = require('gulp-ng-annotate');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-minify-css');
var concatCss = require('gulp-concat-css');
var inline_base64 = require('gulp-inline-base64');
var autoprefixer = require('gulp-autoprefixer');

// ----------------------------------------------------------------------------- VARIABLES
var src_js = ['./assets/js/**/*.js'];
var dir_js = './assets/prod';

var src_css = ['./assets/scss/styles.scss'];
var watch_css = './assets/scss/**/*.scss';
var dir_css = './assets/prod';

// ----------------------------------------------------------------------------- TASKS
gulp.task('default', ['dev'], function() {
  gulp.watch(src_js,  ['js-dev']);
  gulp.watch(watch_css,  ['css-dev']);
});

gulp.task('dev', ['js-dev', 'css-dev']);
gulp.task('prod', ['js-prod', 'css-prod']);

// ----------------------------------------------------------------------------- JS

gulp.task('js-dev', function() {
  return gulp.src(src_js)
    .pipe(concat('all.js'))
    .pipe(ngAnnotate())
    .pipe(gulp.dest(dir_js));
});

gulp.task('js-prod', function() {
  return gulp.src(src_js)
    .pipe(concat('all.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest(dir_js));
});

// ----------------------------------------------------------------------------- CSS
gulp.task('css-dev', function () {
  return gulp.src(src_css)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(concatCss('style.css'))
    .pipe(gulp.dest(dir_css));
});

gulp.task('css-prod', function() {
  return gulp.src(src_css)
    .pipe(sass().on('error', sass.logError))
    .pipe(concatCss('style.css'))
    .pipe(inline_base64({
        baseDir:  './assets/prod/',
        maxSize: 14 * 1024,
        debug: true
    }))
    .pipe(autoprefixer("last 2 version", "> 1%", {
        cascade: true
    }))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulp.dest(dir_css));
});
