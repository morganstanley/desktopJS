'use strict';

var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    gulpts = require('gulp-typescript'),
    jasmine = require('gulp-jasmine'),
    istanbul = require('gulp-istanbul'),
    webserver = require('gulp-webserver'),
    instanbulEnforcer = require('gulp-istanbul-enforcer'),
    remap = require('remap-istanbul/lib/gulpRemapIstanbul'),
    rollup = require('rollup'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    commonjs = require('rollup-plugin-commonjs'),
    tsrollup = require('rollup-plugin-typescript'),
    typescript = require('typescript'),
    pkg = require('./package.json');

var src = ['src/**/*.ts'];
var testSrc = ['**/*.ts', '!node_modules/**/*.ts', '**/*.spec.ts', '!node_modules/**/*.spec.ts'];

var dest = 'dist';
var testOutput = 'build';
var coverageOutput = 'build/coverage';
var coverageFile = coverageOutput + '/coverage-final.json';
var lcovFile = coverageOutput + '/lcov.info';

var tsProject = gulpts.createProject('tsconfig.json');
var tsTestProject = gulpts.createProject('tsconfig-tests.json');

gulp.task('tslint', function () {
    return gulp.src(src)
        .pipe(tslint({ formatter: "verbose", configuration: "tslint.json" }))
        .pipe(tslint.report({ summarizeFailureOutput: true }));
});

gulp.task('clean', ['clean-test'], function () {
    return gulp.src('dist', { read: false })
        .pipe(clean());
});

gulp.task('clean-test', function () {
    return gulp.src('build', { read: false })
        .pipe(clean());
});

gulp.task('build', ['clean', 'tslint'], function () {
    return rollup.rollup({
        entry: 'src/desktop.ts',
        plugins: [
            tsrollup({ typescript: typescript }),
            nodeResolve(),
            commonjs()
        ]
    }).then(function (bundle) {
        bundle.write({
            dest: pkg.main,
            format: 'umd',
            moduleName: pkg.title,
            sourceMap: true,
        });
    });
});

gulp.task('build-tests', ['clean-test'], function () {
    var tsResult = gulp.src(testSrc)
        .pipe(sourcemaps.init())
        .pipe(tsTestProject({
            typescript: typescript,
        }));

    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(testOutput));
});

gulp.task('test', ['build-tests'], function () {
    gulp.src('build/src/**/*.js')
        .pipe(istanbul({ includeUntested: true }))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            gulp.src(['build/tests/**/*.js', 'build/tests/**/*.spec.js'])
                .pipe(jasmine({ verbose: true, errorOnFail: true, includeStackTrace: false }))
                .pipe(istanbul.writeReports({
                    dir: coverageOutput,
                    reporters: ['json']
                }))
                .on('end', remapCoverageFiles)
                .on('finish', function () {
                    gulp.src('.')
                        .pipe(instanbulEnforcer({
                            coverageDirectory: coverageOutput,
                            rootDirectory: '',
                            thresholds: {
                                statements: 80
                            }
                        }));
                });
        });
});

/** Take js coverage json and remap to typescript.  Output html and text */
function remapCoverageFiles() {
    return gulp.src(coverageFile)
        .pipe(remap({
            reports: {
                'json': coverageFile, // overwrite js based json with ts remapped version
                'html': coverageOutput,
                'text': null,
                'lcovonly': lcovFile
            }
        }));
};

gulp.task('compress', ['build'], function (cb) {
    return gulp.src(pkg.main)
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest(dest));
});

gulp.task("server", function () {
    gulp.src(['examples/web', 'dist'])
        .pipe(webserver({
            fallback: 'index.html',
            livereload: {
                enable: true
            }
        }));
});

gulp.task('bundle', ['tslint', 'clean', 'build', 'test', 'compress']);

gulp.task('watch', function () {
    gulp.watch(src, ['bundle']);
});

gulp.task('default', ['bundle']);