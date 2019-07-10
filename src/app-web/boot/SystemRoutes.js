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
import ViewMain from '../ViewMain/ViewMain';
import ViewMainRefactor from '../ViewMain/ViewMainRefactor';
import ViewBasic from '../ViewBasic/ViewBasic';
import ViewAdmin from '../ViewAdmin/ViewAdmin';

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
    path: '/basic',
    exact: true,
    component: ViewBasic
  },
  {
    path: '/admin',
    exact: true,
    component: ViewAdmin
  },
  {
    path: '/:mode',
    exact: true,
    component: ViewMainRefactor
  },
  {
    path: '/',
    exact: true,
    component: ViewMain
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
