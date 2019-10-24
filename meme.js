#!/usr/bin/env node
/*/
to pass a parameter via npm run script, you have to use -- as in
npm run myscript -- --myoptions=something
alternatively you'll just write your own script that does it
/*/
const fs = require('fs');
const DBG = false;
if (!fs.existsSync('./node_modules/ip')) {
  console.log(`\x1b[30;41m\x1b[37m MEME STARTUP ERROR \x1b[0m\n`);
  let out = '';
  out += `MISSING CRITICAL MODULE\n`;
  out += `is this the \x1b[33mfirst time running MEME\x1b[0m `;
  out += `or did you just run \x1b[33mnpm clean:all\x1b[0m?\n`;
  out += `run \x1b[33mnpm ci\x1b[0m to install all node_modules\n`;
  console.log(out);
  process.exit(0);
}

const path = require('path');
const ip = require('ip');
const process = require('process');
const shell = require('shelljs');
const argv = require('minimist')(process.argv.slice(1));
const PROMPTS = require('./src/system/util/prompts');
const URSERVER = require('./src/system/server.js');
const MTERM = require('./src/cli/meme-term');
const { notarize } = require('electron-notarize');

if (!shell.which('git')) {
  shell.echo(`\x1b[30;41m You must have git installed to run the MEME devtool \x1b[0m`);
  shell.exit(0);
}

const pathBits = path.parse(argv._[0]);
const param1 = argv._[1];

const { TERM } = MTERM;
const TR = TERM.Reset;
const TB = TERM.Bright;
const CY = TERM.FgYellow;
const CR = `${TERM.BgRed}${TERM.FgWhite}`;

const PR = PROMPTS.Pad('MEME EXEC');

const P_ERR = `${TB}${CR}!ERROR!${TR}`;

const PATH_WEBPACK = `./node_modules/webpack/bin`;
const PATH_APP = `./dist/meme-darwin-x64/meme.app`;
const APP_BUNDLE_ID = 'com.davidseah.inquirium.meme';
const ELECTRON_VERSION = '3.1.13'; // https://github.com/electron/electron/releases?after=v3.1.0-beta.4

switch (param1) {
  case 'dev':
    f_RunDevServer();
    break;
  case 'clean':
    f_Clean({ all: argv.all });
    break;
  case 'doc':
    f_DocServe();
    break;
  case 'electron':
    f_RunElectron();
    break;
  case 'package':
    f_PackageApp();
    break;
  case 'appsign':
    f_SignApp();
    break;
  case 'appnotarize':
    f_Notarize();
    break;
  case 'appcheck':
    f_InspectSignedApp();
    break;
  case 'debugapp':
    f_DebugApp();
    break;

  default:
    console.log(`${PR}\n- ${P_ERR} unknown command '${param1}'\n`);
}

function u_checkError(execResults) {
  if (!execResults.stderr) return;
  console.log(`${CR}*** ERROR IN MEME EXEC ***${TR}`);
  console.log(execResults.stderr);
  process.exit(0);
}

function f_RunDevServer() {
  //    "dev": "echo '\n*** USING WEBPACK HOT DEV SERVER' && webpack-dev-server  --mode development --inline --hot --host 0.0.0.0 --config=./src/config/webpack.webapp.config.js --env.HMR_MODE='wds'",
  console.log(`\n`);
  console.log(PR, `running Development Server`);
  // git branch information
  const { error, stdout } = shell.exec('git symbolic-ref --short -q HEAD', { silent: true });
  if (error) console.log(PR, `on ${CY}detached${TR} head`);
  if (stdout) console.log(PR, `on branch ${CY}${stdout.trim()}${TR}`);

  // run webpack development server
  // const wds = shell.exec(
  //   `${PATH_WDS}/webpack-dev-server.js --mode development --inline --hot --host 0.0.0.0 --config=./src/config/webpack.webapp.config.js --env.HMR_MODE='wds'`,
  //   { silent: true, async: true }
  // );
  // wds.on('exit', () => {
  //   console.log(`\n${PR} webpack-dev-server has been terminated\n`);
  //   process.exit();
  // });
  // process.on('SIGINT', () => {
  //   wds.kill('SIGHUP');
  // });

  // run ursys socket server
  // note: in electron mode, this server is loaded from inside electron's console-main.js
  URSERVER.Initialize({ memehost: 'devserver' });
  URSERVER.StartNetwork();
  URSERVER.StartWebServer();
}

function f_RunElectron() {
  console.log(`\n`);
  console.log(PR, `running ${CY}Electron Host with Live Reload${TR}`);
  console.log(PR, `compiling electron renderprocess files with webpack.console.config`);
  let res = shell.exec(
    // note: to pass an enviroment setting to the webpack config script, add --env.MYSETTING='value'
    `${PATH_WEBPACK}/webpack.js --mode development --config ./src/config/webpack.console.config.js`,
    { silent: DBG }
  );
  u_checkError(res);
  shell.exec(`npx electron ./built/console/console-main`);
}

function f_PackageApp() {
  console.log(`\n`);
  console.log(PR, `packaging ${CY}mac electron app${TR} 'meme.app'`);
  console.log(PR, `erasing ./built and ./dist directories`);
  shell.rm('-rf', './dist', './built');
  console.log(PR, `compiling console, web, system files into ./built`);

  let res = shell.exec(
    // note: to pass an enviroment setting to the webpack config script, add --env.MYSETTING='value'
    `${PATH_WEBPACK}/webpack.js --mode development --config ./src/config/webpack.dist.config.js`,
    { silent: DBG }
  );
  u_checkError(res);
  console.log(PR, `installing node dependencies into ./built`);
  shell.cd('built');
  shell.exec('npm install', { silent: DBG });
  console.log(PR, `using electron-packager to write 'meme.app' to ./dist`);
  const env = DBG ? 'DEBUG=electron-packager ' : '';
  res = shell.exec(
    `${env}npx electron-packager . meme --out ../dist --overwrite --electron-version ${ELECTRON_VERSION} --app-bundle-id ${APP_BUNDLE_ID}`,
    { silent: DBG }
  );
  // u_checkError(res); // electron-packager stupidly emits status to stderr
  console.log(PR, `electron app written to ${CY}dist/meme-darwin-x64$/meme.app${TR}`);
  console.log(PR, `NOTE: default macos security requires ${CR}code signing${TR} to run app.`);
  console.log(PR, `use ${CY}npm run appsign${TR} to use default developer id (if installed)\n`);
}

function f_SignApp() {
  console.log(`\n`);
  console.log(PR, `using electron-osx-sign to ${CY}securely sign${TR} 'meme.app'`);
  const env = DBG ? 'DEBUG=electron-osx-sign ' : '';
  const { stderr, stdout } = shell.exec(
    `${env}npx electron-osx-sign ${PATH_APP} --platform=darwin --type=distribution --version=${ELECTRON_VERSION} --strict --hardened-runtime --entitlements=package-macos/meme.entitlements --entitlements-inherited=package-macos/meme-inherit.entitlements`,
    { silent: DBG }
  );
  if (stderr) {
    console.log(`\n${stderr.trim()}\n`);
    console.log(PR, `${CR}ERROR${TR} signing app with electron-osx-sign`);
  }
  if (stdout) {
    console.log(PR, `${stdout.trim()}`);
    console.log(PR, `use script ${CY}npm run app${TR} to run with console debug output\n`);
  }
}

async function f_Notarize() {
  console.log(`\n`);
  console.log(PR, `using electron-notarize to ${CY}submit app for notarization${TR}`);
  console.log(PR, `(this may take a while as it requires Apple servers to respond`);
  const { AC_USER, AC_PASS } = process.env;
  if (!(AC_USER && AC_PASS)) {
    console.log(PR, `${CR}ERROR${TR} AC_USER and AC_PASS must be set in notarize command.`);
    console.log(PR, `e.g. ${CY}AC_USER=appleid AC_PASS=password npm run notarize${TR}`);
    return;
  }
  console.log('user:', AC_USER, 'pass:', AC_PASS);
  let res = await notarize({
    appBundleId: APP_BUNDLE_ID,
    appPath: PATH_APP,
    appleId: AC_USER,
    Password: AC_PASS
  });
  console.log('notarized? submitted?', JSON.stringify(res));
}

function f_InspectSignedApp() {
  console.log(`\n`);
  console.log(PR, `spctl - showing ${CY}system policy status${TR} for 'meme.app'`);
  console.log(PR, `(look for ${CY}'source=Notarized Developer ID'${TR})`);
  let { stderr, stdout } = shell.exec(`spctl -a -vvv -t install ${PATH_APP}`, {
    silent: true
  });
  if (stderr) splitPrint(stderr);
  if (stdout) splitPrint(stdout);
  //
  console.log(PR, `codesign - showing verbose ${CY}flags${TR} and ${CY}entitlement${TR} (if any)`);
  console.log(PR, `(look for ${CY}'flags=(runtime)'${TR} to indicate hardened runtime)`);
  ({ stderr, stdout } = shell.exec(`codesign --display --verbose ${PATH_APP}`, {
    silent: true
  }));
  if (stderr) splitPrint(stderr);
  if (stdout) splitPrint(stdout);
}

function f_DebugApp() {
  console.log(`\n`);
  console.log(PR, `running meme.app with ${CY}console output${TR} to terminal`);
  console.log(PR, `verifying code signature`);
  const { code, stderr } = shell.exec(`codesign -dvv ${PATH_APP}`, {
    silent: true
  });
  if (code === 0) {
    console.log(PR, `${CY}console output${TR} from meme.app will appear below`);
    console.log(PR, `${CY}CTRL-C${TR} or ${CY}close app window${TR} to terminate\n`);
    shell.exec(`${PATH_APP}/Contents/MacOS/meme`);
  } else {
    console.log(`\n${stderr.trim()}\n`);
    console.log(PR, `${CR}ERROR${TR} from codesign check`);
    console.log(PR, `macos will not run this app until it is signed`);
    console.log(PR, `if apple developer certs are installed you can run ${CY}npm run appsign${TR}`);
  }
}

function f_DocServe() {
  const loc = `${CY}localhost:4001${TR}`;

  console.log(PR, `point your browser to "${loc}" to read JSDoc-generate documentation.`);
  console.log(
    PR,
    `you can edit source and the documentation will live-update (browser refresh required).`
  );
  console.log(PR, `when you're done, type CTRL-C to stop the documentation server`);
  shell.exec(
    `npx documentation serve --config meme-documentation.yml --watch ./src/app-web/web-index.js`
  );
}

function f_Clean(opt) {
  console.log(PR, `removing dist/, runtime/ and built/ directories...`);
  shell.rm('-rf', 'dist', 'built', 'runtime');
  console.log(PR, `directories removed!`);
  if (opt.all) {
    console.log(PR, `also removing node_modules/`);
    shell.rm('-rf', 'node_modules');
    console.log(PR, `you will have to reinstall them with the`);
    console.log(PR, `${TERM.FgYellow}npm ci${TERM.Reset} command.`);
    // shell.exec('npm ci', { silent: DBG });
  }
  console.log(PR, `operation complete!`);
}

function splitPrint(lfstring) {
  const out = lfstring.trim().split('\n');
  out.forEach(line => console.log(PR, '   ', line));
}
