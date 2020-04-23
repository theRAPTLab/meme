/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemRoutes - define top-level routes to views

  This module is imported into SystemShell.jsx to generate
  ReactRouter-compatible <Route> entries

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import ViewMain from '../views/ViewMain/ViewMain';
import PrintMain from '../views/ViewMain/PrintMain';
import TestUr from '../views/DevTest/TestUr';
import TestScreencap from '../views/DevTest/TestScreencap';
import TestLockSync from '../views/DevTest/TestLockSync';
import TestDBLock from '../views/DevTest/TestDBLock';
import ViewAdmin from '../views/ViewAdmin/ViewAdmin';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/*****************************************************************************\

  MAIN ROUTE DECLARATION

  declare main view routes here
  list more specific routes first
  url format is host:3000/#dev

\*****************************************************************************/

const SystemRoutes = [
  {
    path: '/test-ur',
    exact: true,
    component: TestUr
  },
  {
    path: '/test-screencap',
    exact: true,
    component: TestScreencap
  },
  {
    path: '/test-dblock',
    exact: true,
    component: TestDBLock
  },
  {
    path: '/test-locksync',
    exact: true,
    component: TestLockSync
  },
  {
    path: '/admin',
    exact: true,
    component: ViewAdmin
  },
  {
    path: '/',
    exact: true,
    component: ViewMain
  },
  {
    path: '/print',
    exact: true,
    component: PrintMain
  },
  {
    path: '*',
    restricted: false,
    component: NoMatch
  }
];

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NoMatch(props) {
  const hash = props.location.pathname.substring(1);
  return (
    <div>
      ViewNoMatch: route no match <tt>#{hash}</tt>
    </div>
  );
}
NoMatch.propTypes = {
  // eslint and proptypes interact poorly and this is OK
  // eslint-disable-next-line react/forbid-prop-types
  location: PropTypes.object
};
NoMatch.defaultProps = {
  // this disables another eslint complaint
  location: null
};

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemRoutes;
