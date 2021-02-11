"use strict";

var clean = require("gulp-clean");

module.exports = function (gulp, path) {
  return function () {
    return gulp.src(path, { read: false, allowEmpty: true }).pipe(clean());
  };
};
