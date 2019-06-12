'use strict';

var rollup = require('rollup'),
    clean = require('gulp-clean'),
    tsrollup = require('rollup-plugin-typescript'),
    replace = require('gulp-replace'),
    rollupReplace = require('rollup-plugin-replace'),
    commonjs = require('rollup-plugin-commonjs'),
    typescript = require('typescript');

module.exports = function (gulp, pkg, config, name, input, iffe) {
    return function () {
        // Main bundle is umd
        return createBundle('umd', pkg.main)
            .then(function () {
                // Generate iife for use as a V8 extension if necessary since umd isn't supported
                createBundle('iife', config.dest + iffe);
            });

        function createBundle(format, destination) {
            return rollup.rollup({
                input: input,
                plugins: [
                    tsrollup({ typescript: typescript }),
                    commonjs(),
                    rollupReplace({
                        PACKAGE_VERSION: pkg.version
                    })
                ]
            }).then(function (bundle) {
                return bundle.write({
                    file: destination,
                    format: format,
                    name: name,
                    moduleName: pkg.title,
                    sourcemap: true,
                    globals: {
                        "@morgan-stanley/desktopjs": "desktopJS"
                    }
                });
            });
        }
    };
}