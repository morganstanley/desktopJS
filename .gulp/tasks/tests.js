'use strict';

var jasmine = require('gulp-jasmine'),
    istanbul = require('gulp-istanbul'),
    remap = require('remap-istanbul/lib/gulpRemapIstanbul'),
    instanbulEnforcer = require('gulp-istanbul-enforcer');

module.exports = function (gulp, config) {
    return function () {
        return gulp.src(config.test.coverage.src)
            .pipe(istanbul({ includeUntested: true }))
            .pipe(istanbul.hookRequire())
            .on('finish', function () {
                gulp.src(config.test.src)
                    .pipe(jasmine({ verbose: true, errorOnFail: true, includeStackTrace: false }))
                    .pipe(istanbul.writeReports({
                        dir: config.test.coverage.dest,
                        reporters: ['json']
                    }))
                    //.on('end', remapCoverageFiles)
                    .on('finish', function () {
                        gulp.src('.')
                            .pipe(instanbulEnforcer({
                                coverageDirectory: config.test.coverage.dest,
                                rootDirectory: '',
                                thresholds: {
                                    statements: config.test.coverage.threshold || 80
                                }
                            }));
                    });
            });

        /** Take js coverage json and remap to typescript.  Output html and text */
        function remapCoverageFiles() {
            return gulp.src(config.test.coverage.coverageFile)
                .pipe(remap({
                    reports: {
                        'json': config.test.coverage.coverageFile, // overwrite js based json with ts remapped version
                        'html': config.test.coverage.dest,
                        'lcovonly': config.test.coverage.lcovFile,
                        'text': null
                    }
                }));
        };
    };
}

