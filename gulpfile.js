const {parallel, series, src, dest, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const minify = require('gulp-minify');
const gulpif = require('gulp-if');
const argv = require('yargs').argv;

function buildCSS() {
    return src('./src/styles/**/*.scss')
    .pipe(sass({
        outputStyle: argv.uncompressed == null ? 'compressed' : null
    }).on('error', sass.logError))
    .pipe(dest('./public/css'));
}

function buildJS() {
    return src('./src/js/**/*.js')
    .pipe(gulpif(argv.uncompressed == null, minify({
        noSource: true,
        ext: {
            min: '.js'
        }
    })))
    .pipe(dest('./public/js'));
}

function watchAll() {
    watch('./src/styles/**/*.scss', buildCSS);
    watch('./src/js/**/*.js', buildJS);
}

module.exports.watch = series(parallel(buildCSS, buildJS), watchAll);
module.exports.default = parallel(buildCSS, buildJS);