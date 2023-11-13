const {parallel, series, src, dest, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const minify = require('gulp-minify');

function buildCSS() {
    return src('./src/styles/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(dest('./public/css'));
}

function buildJS() {
    return src('./src/js/**/*.js')
    .pipe(minify({noSource: true}))
    .pipe(dest('./public/js'));
}

function watchAll() {
    watch('./src/styles/**/*.scss', buildCSS);
    watch('./src/js/**/*.js', buildJS);
}

module.exports.watch = series(parallel(buildCSS, buildJS), watchAll);
module.exports.default = parallel(buildCSS, buildJS);