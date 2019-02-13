'use strict';

var typedoc = require('gulp-typedoc');

module.exports = function (gulp, config) {
    return function () {
        return gulp
            .src(config.documentation.src)
            .pipe(typedoc({
                "name": "desktopJS",
                "mode": "modules",
                "target": "ES6",
                "module": "umd",
                "includeDeclarations": true,
                "excludeExternals": true,
                "excludePrivate": true,
                "out": config.documentation.out,
                "hideGenerator": true,
                "ignoreCompilerErrors": true,
                "logger": "none"
            }))
            .on('end', function () {
                require('fs').writeFileSync('docs/.nojekyll', '');
            });
    }
}