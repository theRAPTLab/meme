/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Prompts for server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

let PROMPTS = {};

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// detect node environment and set padsize accordingly
const IS_NODE =
  typeof process !== 'undefined' && process.release && process.release.name === 'node';
let PAD_SIZE = IS_NODE
  ? 13 // nodejs
  : 0; // not nodejs

/// PROMPT STRING HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return a string padded to work as a prompt for either browser or node
    console output
/*/ PROMPTS.Pad = (
  prompt = '',
  psize = PAD_SIZE
) => {
  let len = prompt.length;
  if (IS_NODE) return `${prompt.padEnd(psize, ' ')}-`;
  // must be non-node environment, so do dynamic string adjust
  if (!psize) return `${prompt}:`;
  // if this far, then we're truncating
  if (len >= psize) prompt = prompt.substr(0, psize - 1);
  else prompt.padEnd(psize, ' ');
  return `${prompt}:`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns PAD_SIZE stars
/*/ PROMPTS.Stars = count => {
  if (count !== undefined) return ''.padEnd(count, '*');
  return ''.padEnd(PAD_SIZE, '*');
};

PROMPTS.CS = '\x1b[34m\x1b[1m';
PROMPTS.CW = '\x1b[32m';
PROMPTS.CR = '\x1b[0m';

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PROMPTS;
