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
    replace = require('gulp-replace'),
    instanbulEnforcer = require('gulp-istanbul-enforcer'),
    remap = require('remap-istanbul/lib/gulpRemapIstanbul'),
    rollup = require('rollup'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    commonjs = require('rollup-plugin-commonjs'),
    tsrollup = require('rollup-plugin-typescript'),
    typescript = require('typescript'),
    pkg = require('./package.json'),
    dts = require('dts-bundle'),
    merge = require('merge2');

var src = ['src/**/*.ts'];
var stagingSrc = ['**/*.ts', '!node_modules/**/*.ts', '**/*.spec.ts', '!node_modules/**/*.spec.ts'];

var dest = 'dist';
var stagingOutput = 'build';
var coverageOutput = stagingOutput + '/coverage';
var coverageFile = coverageOutput + '/coverage-final.json';

var tsProject = gulpts.createProject('tsconfig.json');
var tsStagingProject = gulpts.createProject('tsconfig-staging.json');

gulp.task('tslint', function () {
    return gulp.src(src)
        .pipe(tslint({ formatter: "verbose", configuration: "tslint.json" }))
        .pipe(tslint.report({ summarizeFailureOutput: true }));
});

gulp.task('clean', ['clean-staging'], function () {
    return gulp.src('dist', { read: false })
        .pipe(clean());
});

gulp.task('clean-staging', function () {
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

gulp.task('build-staging', ['clean-staging'], function () {
    var tsResult = gulp.src(stagingSrc)
        .pipe(sourcemaps.init())
        .pipe(tsStagingProject({
            typescript: typescript,
        }));

    return merge([
        tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(stagingOutput)),
        tsResult.dts
            .pipe(gulp.dest(stagingOutput))
    ]);;
});

gulp.task('test', ['build-staging'], function () {
    return gulp.src('build/src/**/*.js')
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

/**
 * Since the default export in umd bundle desktop.js has hierarchy we need to introduce modules into the .d.ts
 * to match this hierarchy before rolling up the declarations
 */
function injectModuleDeclarations(src) {
    return src.pipe(replace(/(\/\*\*[\s\S]*export declare class (\w+)ContainerWindow[\s\S]*})/, "export module $2 {\n$1\n}"))
        .pipe(clean())
        .pipe(gulp.dest(stagingOutput + "/src"));
}

gulp.task('dts', ['build-staging'], function () {
    return injectModuleDeclarations(gulp.src(
        [
            stagingOutput + "/src/Default/default.d.ts",
            stagingOutput + "/src/Electron/electron.d.ts",
            stagingOutput + "/src/OpenFin/openfin.d.ts",
            stagingOutput + "/src/Minuet/minuet.d.ts"
        ], { base: stagingOutput + "/src" }))
        .on('finish', function () {
            dts.bundle({
                name: pkg.name,
                main: stagingOutput + "/src/desktop.d.ts",
                out: "../../" + pkg.types,
                verbose: false,
                outputAsModuleFolder: true
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
                'text': null
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

gulp.task('bundle', ['tslint', 'clean', 'build', 'test', 'dts', 'compress']);

gulp.task('watch', function () {
    gulp.watch(src, ['bundle']);
});

gulp.task('default', ['bundle']);