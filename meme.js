#!/usr/bin/env node
/*/
to pass a parameter via npm run script, you have to use -- as in
npm run myscript -- --myoptions=something
alternatively you'll just write your own script that does it
/*/
const fs = require('fs');

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

switch (param1) {
  case 'dev':
    f_RunDevServer({ memehost: 'devserver' });
    break;
  case 'production':
    f_RunDevServer({ memehost: 'production' });
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

function f_RunDevServer(memehost) {
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
  URSERVER.Initialize(memehost);
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
    { silent: true }
  );
  u_checkError(res);
  shell.exec(`npx electron ./built/console/console-main`);
}

function f_PackageApp() {
  console.log(`\n`);
  console.log(PR, 'replace with electron-forge');
}

function f_SignApp() {
  console.log(`\n`);
  console.log(PR, 'replace with electron-forge');
}

function f_DebugApp() {
  console.log(`\n`);
  console.log(PR, `running meme.app with ${CY}console output${TR} to terminal`);
  console.log(PR, `verifying code signature`);
  const { code, stderr } = shell.exec('codesign -dvv ./dist/meme-darwin-x64/meme.app', {
    silent: true
  });
  if (code === 0) {
    console.log(PR, `${CY}console output${TR} from meme.app will appear below`);
    console.log(PR, `${CY}CTRL-C${TR} or ${CY}close app window${TR} to terminate\n`);
    shell.exec('./dist/meme-darwin-x64/meme.app/Contents/MacOS/meme');
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
    // shell.exec('npm ci', { silent: true });
  }
  console.log(PR, `operation complete!`);
}
