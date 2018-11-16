'use strict';

var gulp = require('gulp'),
    pkg = require('./package.json'),
    runSequence = require('run-sequence'),
    gulpConfig = require('../../.gulp/gulpConfig');

gulp.task('tslint', require('../../.gulp/tasks/tslint')(gulp, gulpConfig));
gulp.task('clean', ['clean:staging'], require('../../.gulp/tasks/clean')(gulp, gulpConfig.dest));
gulp.task('clean:staging', require('../../.gulp/tasks/clean')(gulp, gulpConfig.staging.dest));
gulp.task('build:main', [], require('../../.gulp/tasks/build')(gulp, pkg, gulpConfig, 'desktopJS.Electron', 'src/electron.ts', '/iffe/desktopjs-electron.js'));
gulp.task('build:staging', [], require('../../.gulp/tasks/stage')(gulp, gulpConfig));
gulp.task('test', ['build:staging'], require('../../.gulp/tasks/tests')(gulp, gulpConfig));
gulp.task('dts', require('../../.gulp/tasks/dts')(gulp, pkg.name, gulpConfig.staging.dest + "/src/electron.d.ts", "../../" + pkg.types));
gulp.task('compress', require('../../.gulp/tasks/compress')(gulp, pkg, gulpConfig));

gulp.task('build', [], function () {
    return runSequence(['tslint', 'clean'], ['build:main', 'test'], ['dts', 'compress']);
});

gulp.task('build:lerna', [], function () {
    return runSequence(['tslint', 'clean'], ['build:main', 'build:staging'], ['dts', 'compress']);
});

gulp.task('watch', [], function () {
    gulp.watch(['src/**/*.*', 'tests/**/*.*', '*.json', '*.js'], function () {
        return runSequence('tslint', ['build:main', 'test'], ['dts', 'compress']);
    });
});

gulp.task('bundle', ['build']);

gulp.task('default', ['bundle']);