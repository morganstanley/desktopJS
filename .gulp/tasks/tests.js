'use strict';

var jasmine = require('gulp-jasmine'),
    istanbul = require('gulp-istanbul'),
    replace = require('gulp-replace'),
    remap = require('remap-istanbul/lib/gulpRemapIstanbul'),
    instanbulEnforcer = require('gulp-istanbul-enforcer');

module.exports = function (gulp, config) {
    return function () {
        return gulp.src(config.test.coverage.src)
            .pipe(istanbul({ includeUntested: true }))
            .pipe(istanbul.hookRequire())
            .on('finish', () => {

                // Run jasmine under istanbul
                gulp.src(config.test.src)
                    .pipe(jasmine({ verbose: true, errorOnFail: true, includeStackTrace: false }))
                    .pipe(istanbul.writeReports({
                        dir: config.test.coverage.dest,
                        reporters: ['json']
                    }))

                    // Take js coverage json and remap to typescript.  Output html and text
                    .on('end', () => {
                        return gulp.src(config.test.coverage.coverageFile)
                            .pipe(remap({
                                reports: {
                                    'json': config.test.coverage.coverageFile, // overwrite js based json with ts remapped version
                                    'html': config.test.coverage.dest,
                                    'lcovonly': config.test.coverage.lcovFile,
                                    'text': null
                                }
                            }))

                            // Remove staging build directory in code coverage for correct file mapping
                            .on('finish', function () {
                                return gulp.src(config.test.coverage.coverageFile)
                                    .pipe(replace(/\\\\build\\\\src/mg, '\\\\src')) // windows
                                    .pipe(replace(/\/build\/src/mg, '/src')) // unix)
                                    .pipe(gulp.dest(config.test.coverage.dest))

                                    // Enforce statement coverage threshold based on config or if not defined 80%
                                    .on('finish', function () {
                                        return gulp.src('.')
                                            .pipe(instanbulEnforcer({
                                                coverageDirectory: config.test.coverage.dest,
                                                rootDirectory: '',
                                                thresholds: {
                                                    statements: config.test.coverage.threshold || 80
                                                }
                                            }));
                                    });
                            })
                    })
            });
    };
}

