/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CONSOLE CONFIGURATION is used to build the console web bundle that is rendered
  in the mainWindow of the electron app. This is not the same as the webapp
  bundle, which is served by server-express to devices that connect. The console
  web bundle is what makes the Electron App look like something.

  notable features:
  * entry point is console.js loaded by console.html
  * copies its own 'console.json' package configuration for use in building


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/

/// LOAD LIBRARIES //////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PROMPTS = require('../system/util/prompts');
//
const { CW, CR } = PROMPTS;
const PR = `${CW}${PROMPTS.Pad('webpack')}${CR}`;

/// CONSTANTS ///////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DIR_CONFIG = path.join(__dirname, '../config/');
const DIR_SOURCE = path.join(__dirname, '../app-console/');
const DIR_SYSTEM = path.join(__dirname, '../system/');
const DIR_OUTPUT = path.join(__dirname, '../../built/');
const ENTRY_MODULE = 'console.js';
const FILE_BUNDLE = 'console.bundle.js';
const ENTRY_HTML = 'console.html';

/// CONSOLE RENDERER CONFIGURATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/
const electronRendererConfig = env => {
  console.log(`${PR} console.config electronRendererConfig loaded`);

  const plugins = [
    new HtmlWebpackPlugin({
      template: ENTRY_HTML, // uses context
      filename: ENTRY_HTML // uses output.path
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      COMPILED_BY: JSON.stringify('console.config.js')
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
      mode: 'development',
      target: 'electron-renderer',
      devtool: 'source-map',
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
const baseConfig = require('./webpack.base.config');
//
module.exports = env => merge(baseConfig(env), electronRendererConfig(env));
