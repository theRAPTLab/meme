/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

RatingButton

This implements a multi-star rating system.

Features:
* Any number of stars can be set
* Supports an expanded and collasped (minified) view.


RATIONALE

The goal is to make this a generalized component that can be used in 
various different circumstances.  So we rely on props calls to communicate
with the parent component.

Props:
    Settings from Parent
      Values
      *   max
      *   rating
      Display Settings
      *   isExpanded
    Settings to Parent
      *   UpdateRating

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
// Material UI Icons
import StarRate from '@material-ui/icons/StarRate';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class RatingButton extends React.Component {
  constructor(props) {
    super(props);
    this.HandleClick = this.HandleClick.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  HandleClick(rating, e) {
    e.stopPropagation();
    this.props.UpdateRating(rating);
  }

  render() {
    const { max, rating, isExpanded } = this.props;
    const { classes } = this.props;
    let icons = [];
    for (let i = 1; i <= max; i++) {
      let icon = (
        <Button
          onClick={e => this.HandleClick(i, e)}
          size="small"
          className={isExpanded ? classes.ratingButtonLarge : classes.ratingButtonSmall}
          key={i}
        >
          <StarRate
            fontSize={isExpanded ? 'large' : 'small'}
            className={i <= rating ? classes.ratingIconSelected : classes.ratingIconUnselected}
          />
        </Button>
      );
      icons.push(icon);
    }
    return <div style={{ display: 'flex' }}>{icons}</div>;
  }
}

RatingButton.propTypes = {
  UpdateRating: PropTypes.func,
  max: PropTypes.number,
  rating: PropTypes.number,
  isExpanded: PropTypes.bool
};

RatingButton.defaultProps = {
  UpdateRating: () => {
    console.error('Missing UpdateRating Handler!');
  },
  max: 3,
  rating: 0,
  isExpanded: false
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(RatingButton);
