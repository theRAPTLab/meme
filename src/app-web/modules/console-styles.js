/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  used for console logging
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const cssur = 'color:pink;background-color:#909;padding:0 4px';
const cssuri = 'color:#000;background-color:#fcf;padding:0 4px';
const cssinfo = 'color:#00f;background-color:#cdf;padding:0 4px';
const cssreact = 'color:#080;background-color:#cfc;padding:0 4px';
const cssalert = 'color:black;background-color:#ffdd99;padding:0 4px';
const cssdraw = 'color:white;background-color:green;padding:0 4px';
const cssdata = 'color:white;background-color:blue;padding:0 4px';
const cssreset = 'color:auto;background-color:auto';
const csstab = 'padding-left:4px';
const csstab2 = 'padding-left:10px';
const cssmark = 'color:white;background-color:red;padding:0 4px';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const cssblue = 'color:blue;';
const cssred = 'color:red;';

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Q(str, delim = '[') {
  let end;
  switch (delim) {
    case '[':
      end = ']';
      break;
    case "'":
      end = "'";
      break;
    case '<':
      end = '>';
      break;
    default:
      delim = '???';
      end = '???';
      break;
  }
  return `${delim}${str}${end}`;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  Q,
  csstab,
  csstab2,
  cssinfo,
  cssdraw,
  cssdata,
  cssreact,
  cssblue,
  cssred,
  cssreset,
  cssalert,
  cssur,
  cssuri,
  cssmark
};
