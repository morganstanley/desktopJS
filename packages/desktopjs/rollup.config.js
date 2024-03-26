import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


export default {
    input: 'build/desktop.js',
    output: {
        file: 'dist/iife/desktop.js',
        format: 'iife',
        name: 'desktop'
    },
    plugins: [
        resolve(),
        commonjs()
    ]
};