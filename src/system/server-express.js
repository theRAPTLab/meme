/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server-express creates an express instance and

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/

/// LIBRARIES ///////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const wpack = require('webpack');
const wpack_mid = require('webpack-dev-middleware'); //webpack hot reloading middleware
const wpack_hot = require('webpack-hot-middleware');
const express = require('express'); //your original BE server
const https = require('https');
const http = require('http');
const path = require('path');
const IP = require('ip');
const FS = require('fs');
const cookiep = require('cookie-parser');
//
const configWebApp = require('../config/webpack.webapp.config');
const PROMPTS = require('../system/util/prompts');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { TERM_EXP: CLR, TERM_WPACK, TR } = PROMPTS;
const PORT = 3000;
const PR = `${CLR}${PROMPTS.Pad('UR_EXPRESS')}${TR}`;
// generate certs:
// https://github.com/sagardere/set-up-SSL-in-nodejs
const KEY = FS.readFileSync(__dirname + '/certs/selfsigned.key');
const CERT = FS.readFileSync(__dirname + '/certs/selfsigned.crt');
const HTTPS_OPTIONS = {
  key: KEY,
  cert: CERT
};

/// SERVER DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const app = express();
let server_http; // server object returned by app.listen()
let server_https;
let DOCROOT; // docroot (changes based on dev or standalone mode)

// server runtime information
let UKEY_IDX = 0; // incremented on every webconnection
const USRV_START = new Date(Date.now()).toISOString(); // server startup time

/// API MEHTHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Start() {
  let promise; // promise object to return
  const isPackaged = __dirname.includes('/Contents/Resources/app/system');
  if (isPackaged) {
    // if server-express is running inside an Electron instance, don't use
    // webpack to bundle the webapp on-the-fly.
    DOCROOT = path.resolve(__dirname, '../web');
    console.log(PR, `SERVING PRECOMPILED WEB BUNDLE FROM VIRTUAL DIRECTORY`);
    server_http = http.createServer(app).listen(PORT, () => {
      console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT}`);
      console.log(PR, `SERVING '${DOCROOT}'`);
    });
    server_https = https.createServer(HTTPS_OPTIONS, app).listen(PORT + 443, () => {
      console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT + 443}`);
      console.log(PR, `SERVING '${DOCROOT}'`);
    });
    promise = Promise.resolve();
  } else {
    // otherwise, we are running as straight node out of npm scripts, or
    // a generic Electron binary was used to load us (Electron works just
    // as a node interpreter ya know!
    console.log(PR, `COMPILING WEBSERVER w/ WEBPACK - THIS MAY TAKE SEVERAL SECONDS...`);
    DOCROOT = path.resolve(__dirname, '../../built/web');

    // RUN WEBPACK THROUGH API
    // first create a webpack instance with our chosen config file
    const webConfig = configWebApp();
    const compiler = wpack(webConfig);

    // add webpack middleware to express
    // also add the hot module reloading middleware
    const instance = wpack_mid(compiler, {
      // logLevel: 'silent', // turns off [wdm] messages
      publicPath: webConfig.output.publicPath,
      stats: 'errors-only' // see https://webpack.js.org/configuration/stats/
    });
    app.use(instance);
    app.use(wpack_hot(compiler));

    // compilation start message
    // we'll start the server after webpack bundling is complete
    // but we still have some configuration to do
    compiler.hooks.afterCompile.tap('StartServer', () => {
      if (!server_http) {
        server_http = http.createServer(app).listen(PORT, () => {
          console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT}`);
          console.log(PR, `SERVING '${DOCROOT}'`);
          console.log(PR, `LIVE RELOAD ENABLED`);
        });
      }
      if (!server_https) {
        server_https = https.createServer(HTTPS_OPTIONS, app).listen(PORT + 443, () => {
          console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT + 443}`);
          console.log(PR, `SERVING '${DOCROOT}'`);
        });
      }
    });

    // return promise when server starts
    promise = new Promise((resolve, reject) => {
      let INTERVAL_COUNT = 0;
      const INTERVAL_MAX = 15;
      let COMPILE_RESOLVED = false;
      const INTERVAL_PERIOD = 2000;
      const COMPILE_TIME = Math.floor((INTERVAL_MAX * INTERVAL_PERIOD) / 1000);
      // start compile status update timer
      let INTERVAL = setInterval(() => {
        if (++INTERVAL_COUNT < INTERVAL_MAX) {
          console.log(PR, `... webpack compiling`);
        } else {
          clearInterval(INTERVAL);
          const emsg = `webpack compile time > INTERVAL_MAX (${COMPILE_TIME} seconds)`;
          const err = new Error(emsg);
          reject(err);
        }
      }, INTERVAL_PERIOD);
      // set resolver
      compiler.hooks.afterCompile.tap('ResolvePromise', () => {
        if (!COMPILE_RESOLVED) {
          console.log(PR, `... webpack done`);
          clearInterval(INTERVAL);
          resolve();
          COMPILE_RESOLVED = true;
        } else {
          console.log(PR, `RECOMPILED SOURCE CODE and RELOADING`);
        }
      });
    });
  }

  // RESUME WITH COMMON SERVER SETUP //

  // configure cookies middleware (appears in req.cookies)
  app.use(cookiep());
  // configure headers to allow cross-domain requests of media elements
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // set the templating engine
  app.set('view engine', 'ejs');
  // handle special case for root url to serve our ejs template
  app.get('/', (req, res) => {
    const URSessionParams = GetTemplateValues(req);
    res.render(`${DOCROOT}/index`, URSessionParams);
  });
  // for everything else...
  app.use('/', express.static(DOCROOT));

  // return promise for async users
  return promise;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetTemplateValues(req) {
  let { ip, hostname } = req;
  if (ip === '::1') ip = '127.0.0.1'; // rewrite short form IP
  const clientKey = `UHT_${String((UKEY_IDX += 1))}`.padStart(5, '0');
  const params = {
    CLIENT_IP: ip,
    CLIENT_Key: clientKey,
    USRV_Host: hostname,
    USRV_IP: IP.address(),
    USRV_MsgPort: 2929,
    USRV_Start: USRV_START
  };
  return params;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { Start };
