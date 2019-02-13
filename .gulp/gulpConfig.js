module.exports = {
    src: ['src/**/*.ts'],
    dest: 'dist',
    staging: {
        dest: 'build',
    },
    test: {
        src: ['**/build/tests/**/*.js', '**/build/tests/**/*.spec.js'],
        coverage: {
            src: ['**/build/src/**/*.js', '!**/node_modules/**/*'],
            dest: 'build/coverage',
            coverageFile: 'build/coverage/coverage-final.json',
            lcovFile: 'build/coverage/lcov.info',
            threshold: 80
        }
    },
    tslint: '../../tslint.json',
    documentation: {
        src: ['packages/**/src/**/*.ts', '!**/*.d.ts' , '!**/node_modules/**/*'],
        out: 'docs/'
    }
};