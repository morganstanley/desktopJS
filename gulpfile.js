'use strict';

var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    gulpConfig = require('./.gulp/gulpConfig');

gulp.task('test', require('./.gulp/tasks/tests')(gulp, gulpConfig));

gulp.task("server", function () {
    return gulp.src(['examples/web', 'packages/desktopjs/dist', 'packages/desktopjs-electron/dist', 'packages/desktopjs-openfin/dist'])
        .pipe(webserver({
            fallback: 'index.html',
            livereload: {
                enable: true
            }
        }));
});

gulp.task('docs', require('./.gulp/tasks/docs')(gulp, gulpConfig));
