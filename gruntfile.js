module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: '\n\n'
			},
			build: {
				src: ['src/**/*.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},

		uglify: {
			options: {
				banner: '// Package: <%= pkg.name %> v<%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>)\n// Copyright: (C) 2017 <%= pkg.author.name %> <<%= pkg.author.email %>>\n// License: <%= pkg.license %>\n',
			},
			build: {
				files: {
					'dist/<%= pkg.name %>.min.js': ['<%= concat.build.dest %>']
				}
			}
		},

		jshint: {
			files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			options: {
				esversion: 6,
				laxbreak: true,
				globals: {
					jQuery:   true,
					console:  true,
					module:   true,
					document: true
				}
			}
		},

		karma: {
			dev: {
				options: {
					files: [
						'node_modules/jasmine-es6-promise-matchers/jasmine-es6-promise-matchers.js',
						'src/polylock.js',
						'test/**/*.js'
					],
					basePath:      '',
					urlRoot:       '/',
					frameworks:    ['jasmine'],
					port:          9876,
					colors:        true,
					autoWatch:     true,
					interval:      200,
					singleRun:     false,
					browsers:      ['ChromeHeadless'],
					reporters:     ['spec', 'coverage'],
					preprocessors: { 'src/polylock.js': ['coverage'] },
					concurrency:   Infinity,
				},
			},
			build: {
				options: {
					files: [
						'node_modules/jasmine-es6-promise-matchers/jasmine-es6-promise-matchers.js',
						'dist/polylock.min.js',
						'test/**/*.js',
					],
					basePath:    '',
					urlRoot:     '/',
					frameworks:  ['jasmine'],
					port:        9876,
					colors:      true,
					autoWatch:   false,
					interval:    200,
					singleRun:   true,
					browsers:    ['ChromeHeadless'],
					reporters:   ['spec'],
					concurrency: Infinity,
				},
			},
		},

		babel: {
			options: {
				presets: ['es2015'],
			},
			build: {
				files: {
					'dist/polylock.js': 'dist/polylock.js',
				},
			},
		},

	});

	grunt.registerTask('dev', ['karma:dev']);
	grunt.registerTask('build', ['jshint', 'concat', 'babel', 'uglify', 'karma:build']);

	grunt.registerTask('default', ['build']);
	grunt.registerTask('test',    ['build']);

};
