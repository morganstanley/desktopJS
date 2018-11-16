'use strict';

var dts = require('dts-bundle');

module.exports = function (gulp, name, main, out) {
    return function () {
        return dts.bundle({
            name: name,
            main: main,
            out: out,
            verbose: false,
            outputAsModuleFolder: true
        });
    };
}

