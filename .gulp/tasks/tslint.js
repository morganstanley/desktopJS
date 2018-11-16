'use strict';

var tslint = require('gulp-tslint');

module.exports = function (gulp, config) {
    return function () {
        return gulp.src(config.src)
            .pipe(tslint({ formatter: "verbose", configuration: config.tslint }))
            .pipe(tslint.report({ summarizeFailureOutput: true }));
    };
}