/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DIST CONFIGURATION is used to create electron package for distribution. It is
  called by meme.js for the 'package' script as one of several steps.

  notable features:
  * webapp js files are bundled into built/web
  * webapp static files are copied from assets as-is
  * electron js files are bundled into built/console

  The contents of the resulting built/ directory are then handled by the rest of
  the meme.js 'package' script.

  When the electron app runs, server-express.js checks to see if it is running
  from a standalone app. If it is, the webserver uses the files created by this
  config file. Otherwise, server-express will load the developer it serves the
  webapp from the bundle created by this config file. Otherwise, server-js loads
  webpack and does the bundling on-the-fly.

  if you change webConfiguration here, check webpack.webapp.config.js to see
  if you need to apply those changes there too.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/
console.log('!!! BUILDING PACKAGE');

const path = require('path');
const merge = require('webpack-merge');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const PROMPTS = require('../system/util/prompts');
//
const PACKAGE = require('../../package.json');
//
const { CW, CR } = PROMPTS;
const PR = `${CW}${PROMPTS.Pad('webpack')}${CR}
`;
// setting up a verbose webpack configuration object
// because our configuration is nonstandard
const webConfiguration = env => {
  console.log(`${PR} dist.config webConfiguration loaded`);
  // these paths might be relative to built/ not src/
  // depending on who is loading this file (wds or electron)
  const DIR_SOURCE = path.resolve(__dirname, '../../src/app-web');
  const DIR_OUTPUT = path.resolve(__dirname, '../../built/web');

  // otherwise we're good
  const entryFiles = ['./web-index.js'];
  const outputDir = DIR_OUTPUT;
  const copyFilesArray = [
    {
      from: `web-index.html.ejs`,
      to: `${DIR_OUTPUT}/index.ejs`,
      toType: 'file'
    },
    {
      from: `favicon.ico`,
      to: `${DIR_OUTPUT}/favicon.ico`,
      toType: 'file'
    },
    {
      from: `static/**`,
      to: `${DIR_OUTPUT}`
    }
  ];
  // return webConfiguration
  return merge([
    // config webapp files
    {
      name: 'webapp',
      target: 'web',
      mode: 'development',
      // define base path for input filenames
      context: DIR_SOURCE,
      // start bundling from this js file
      entry: entryFiles,
      // bundle file name
      output: {
        path: outputDir,
        filename: 'web-bundle.js',
        pathinfo: false // this speeds up compilation (https://webpack.js.org/guides/build-performance/#output-without-path-info)
        // publicPath: 'web',
      },
      devtool: 'source-map',
      // apply these additional plugins
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('development'),
          COMPILED_BY: JSON.stringify('dist.config.js')
        }),
        new CopyWebpackPlugin(copyFilesArray)
      ],
      stats: 'errors-only'
    }
  ]);
}; // const webConfiguration

const electronConfiguration = env => {
  console.log(`${PR} dist.config electronConfiguration loaded`);

  const DIR_CONFIG = path.join(__dirname, '../config/');
  const DIR_SOURCE = path.join(__dirname, '../app-console/');
  const DIR_SYSTEM = path.resolve(__dirname, '../../src/system');
  const DIR_OUTPUT = path.join(__dirname, '../../built/');
  const ENTRY_MODULE = 'console.js';
  const FILE_BUNDLE = 'console.bundle.js';
  const ENTRY_HTML = 'console.html';

  const plugins = [
    // only add hot module reloading in wds mode

    new HtmlWebpackPlugin({
      template: ENTRY_HTML, // uses context
      filename: ENTRY_HTML // uses output.path
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      __REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })',
      PACKAGE_TITLE: JSON.stringify(PACKAGE.title),
      PACKAGE_VERSION: JSON.stringify(PACKAGE.version),
      PACKAGE_DESCRIPTION: JSON.stringify(PACKAGE.description)
    }),
    new CopyWebpackPlugin([
      {
        from: DIR_SOURCE,
        to: `${DIR_OUTPUT}/console`,
        // ignore console.html and console.js (built by webpack)
        // ignore console.package.json (renamed to built/package.json)
        ignore: ['.*', 'console.*']
      },
      {
        from: DIR_SYSTEM,
        to: `${DIR_OUTPUT}/system`
        // have to also copy the system directory
        // that contains URSYS, because this will be
        // served from the built directory as well
      },
      {
        from: `${DIR_SOURCE}/console.package.json`,
        to: `${DIR_OUTPUT}/package.json`,
        toType: 'file'
      },
      {
        from: `${DIR_CONFIG}/*`,
        to: `${DIR_OUTPUT}/config`
      }
    ])
  ];

  return merge([
    {
      name: 'console',
      mode: 'development',
      target: 'electron-renderer',
      devtool: 'inline-cheap-source-map',
      context: DIR_SOURCE,
      entry: [`./${ENTRY_MODULE}`], // leading ./ is required
      output: {
        path: `${DIR_OUTPUT}/console`,
        // is this necessary?
        // publicPath: DIR_PUBLIC_CONTEXT,
        filename: FILE_BUNDLE
      },
      plugins,
      stats: 'errors-only'
    }
  ]);
};
// return merged configurations
// webpack will pass the current environment since we are returning function
module.exports = env => [
  merge(baseConfig(env), webConfiguration(env)),
  merge(baseConfig(env), electronConfiguration(env))
];
