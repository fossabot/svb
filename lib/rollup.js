const path = require('path');

const svelte = require('rollup-plugin-svelte');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const livereload = require('rollup-plugin-livereload');
const serve = require('rollup-plugin-serve');
const sourcemaps = require('rollup-plugin-sourcemaps');
const { terser } = require('rollup-plugin-terser');
const getPort = require('get-port');

const { BUNDLE_FILENAME } = require('./constants.js');


const getPlugins = async ({
  input,
  output,
  isDevelopmentMode,
}) => {
  const inputFolder = path.dirname(input);
  const port = await getPort({
    port: getPort.makeRange(3000, 3100),
  });
  return isDevelopmentMode
    //  Dev plugins
    ? [
      sourcemaps(),
      serve({
        // Launch in browser
        open: true,
        contentBase: output,
        port,
        verbose: true,
      }),
      livereload({
        watch: [
          output,
          inputFolder,
        ],
        exts: ['html', 'svelte'], // eslint-disable-line unicorn/prevent-abbreviations
      }),
    ]
    //  Prod plugins
    : [
      terser(),
    ];
};

const getInputConfig = async ({
  input, output, isDevelopmentMode,
}) => ({
  input,
  plugins: [
    svelte({
      //  Extract any component CSS out into a separate file, as it is better for performance
      css: css => css.write(`${output}/${BUNDLE_FILENAME.CSS}`, isDevelopmentMode), // 2nd argument is for sourcemaps
    }),
    //  For resolve external NPM dependencies
    resolve({
      browser: true,
    }),
    //  For convert any CommonJS modules to ES6
    commonjs({
      include: 'node_modules/**', // TODO [>=1]: is this relative to svb/node_modules?
    }),
  ].concat(
    await getPlugins({
      input,
      output,
      isDevelopmentMode,
    }),
  ),
});

const getOutputConfig = ({
  output,
  isDevelopmentMode,
}) => ({
  format: 'iife',
  dir: output, // eslint-disable-line unicorn/prevent-abbreviations
  name: 'bundle.js',
  sourcemap: isDevelopmentMode,
});

module.exports.getInputConfig = getInputConfig;
module.exports.getOutputConfig = getOutputConfig;
