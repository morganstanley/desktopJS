/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

'use strict';

var gulp = require('gulp'),
    connect = require('gulp-connect'),
    gulpConfig = require('./.gulp/gulpConfig');

gulp.task('test', require('./.gulp/tasks/tests')(gulp, gulpConfig));

gulp.task("server", function () {
	connect.server({
		root: ['examples/web', 'packages/desktopjs/dist', 'packages/desktopjs-electron/dist', 'packages/desktopjs-openfin/dist'],
		port: 8000,
		livereload: true
  	});
});