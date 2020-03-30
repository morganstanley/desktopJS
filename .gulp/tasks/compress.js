'use strict';

var uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    rename = require('gulp-rename');

module.exports = function (gulp, pkg, dest) {
    return function () {
        return gulp.src(pkg)
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify())
            .pipe(rename({ extname: '.min.js' }))
            .pipe(sourcemaps.write(''))
            .pipe(gulp.dest(dest));
    };
}
