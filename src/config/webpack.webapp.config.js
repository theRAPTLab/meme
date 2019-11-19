/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WEBAPP CONFIGURATION is used to create the bundle files suitable for serving
  through a webserver. This config is used by server-express.js when the code
  is NOT running as a stand-alone app:

  * when running as a pure Node application
  * when running as an Electron-hosted application (Electron is a wrapper around Node)

  notable features:
  * uses webpack-middleware-hot for hot module replacement
  * if you change webConfiguration here, mirror to webpack.dist.config.js as well

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/
const path = require('path');
const merge = require('webpack-merge');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const baseConfig = require('./webpack.base.config');

const PROMPTS = require('../system/util/prompts');
//
const { TERM_EXP: CW, CR } = PROMPTS;
const PR = `${CW}${PROMPTS.Pad('WEBPACK')}${CR}`;

// setting up a verbose webpack configuration object
// because our configuration is nonstandard
const webConfiguration = env => {
  console.log(PR, `... using webpack.webapp.config`);

  let entryFiles = ['./web-index.js', 'webpack-hot-middleware/client?reload=true'];
  const DIR_SOURCE = path.resolve(__dirname, '../../src/app-web');
  let DIR_OUT = path.resolve(__dirname, '../../built/web');
  const copyFilesArray = [
    {
      from: `web-index.html.ejs`,
      to: `${DIR_OUT}/index.ejs`,
      toType: 'file'
    },
    {
      from: `favicon.ico`,
      to: `${DIR_OUT}/favicon.ico`,
      toType: 'file'
    },
    {
      from: `static`,
      to: `${DIR_OUT}/static`,
      toType: 'dir'
    }
  ];

  // return webConfiguration
  return merge([
    // config webapp files
    {
      target: 'web',
      mode: 'development',
      // define base path for input filenames
      context: DIR_SOURCE,
      // start bundling from this js file
      entry: entryFiles,
      // bundle file name
      output: {
        path: DIR_OUT,
        filename: 'web-bundle.js',
        pathinfo: false // this speeds up compilation (https://webpack.js.org/guides/build-performance/#output-without-path-info)
        // publicPath: 'web',
      },
      node: {
        // enable webpack's __filename and __dirname substitution in browsers
        // for use in URSYS lifecycle event filtering as set in SystemInit.jsx
        __filename: true,
        __dirname: true
      },
      devtool: 'source-map',
      // apply these additional plugins
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('development'),
          COMPILED_BY: JSON.stringify('webapp.config.js')
        }),
        new WriteFilePlugin({
          test: /^(.(?!.*\.hot-update.js$|.*\.hot-update.*))*$/ // don't write hot-updates at all, just bundles
        }),
        new CopyWebpackPlugin(copyFilesArray),
        new webpack.HotModuleReplacementPlugin()
      ]
    }
  ]);
}; // const webConfiguration

// return merged configurations
// webpack will pass the current environment since we are returning function
module.exports = env => merge(baseConfig(env), webConfiguration(env));
