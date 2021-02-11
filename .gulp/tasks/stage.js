"use strict";

var sourcemaps = require("gulp-sourcemaps"),
  gulpts = require("gulp-typescript"),
  merge = require("merge2");

module.exports = function (gulp, config) {
  return function () {
    var tsProject = gulpts.createProject("./tsconfig.staging.json");

    var tsResult = tsProject
      .src()
      .pipe(sourcemaps.init())
      .pipe(tsProject(gulpts.reporter.fullReporter(true)));

    return merge([
      tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(config.staging.dest)),
      tsResult.dts.pipe(gulp.dest(config.staging.dest)),
    ]);
  };
};
