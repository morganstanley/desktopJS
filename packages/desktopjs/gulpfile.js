"use strict";

var gulp = require("gulp"),
  pkg = require("./package.json"),
  gulpConfig = require("../../.gulp/gulpConfig");

gulp.task(
  "clean:staging",
  require("../../.gulp/tasks/clean")(gulp, gulpConfig.staging.dest)
);
gulp.task(
  "clean",
  gulp.series(
    ["clean:staging"],
    require("../../.gulp/tasks/clean")(gulp, gulpConfig.dest)
  )
);
gulp.task(
  "build:main",
  require("../../.gulp/tasks/build")(
    gulp,
    pkg,
    gulpConfig,
    "desktopJS",
    "src/desktop.ts",
    "/iffe/desktop.js"
  )
);
gulp.task(
  "build:staging",
  require("../../.gulp/tasks/stage")(gulp, gulpConfig)
);
gulp.task(
  "test",
  gulp.series(
    ["build:staging"],
    require("../../.gulp/tasks/tests")(gulp, gulpConfig)
  )
);
gulp.task(
  "dts",
  require("../../.gulp/tasks/dts")(
    gulp,
    pkg.name,
    gulpConfig.staging.dest + "/src/desktop.d.ts",
    "../../" + pkg.types
  )
);
gulp.task(
  "compress",
  gulp.parallel(
    require("../../.gulp/tasks/compress")(gulp, pkg.main, gulpConfig.dest),
    require("../../.gulp/tasks/compress")(
      gulp,
      gulpConfig.dest + "/iffe/desktop.js",
      gulpConfig.dest + "/iffe"
    )
  )
);
gulp.task(
  "build",
  gulp.series(
    gulp.parallel(["clean"]),
    gulp.parallel(["build:main", "test"]),
    gulp.parallel(["dts", "compress"])
  )
);
gulp.task(
  "build:lerna",
  gulp.series(
    "clean",
    gulp.parallel(["build:main", "build:staging"]),
    gulp.parallel(["dts", "compress"])
  )
);
gulp.task("watch", () =>
  gulp.watch(
    ["src/**/*.*", "tests/**/*.*", "*.json", "*.js"],
    { ignoreInitial: true, delay: 1000 },
    gulp.series(
      gulp.parallel(["build:main", "test"]),
      gulp.parallel(["dts", "compress"])
    )
  )
);
gulp.task("bundle", gulp.series(["build"]));
gulp.task("default", gulp.series(["bundle"]));
