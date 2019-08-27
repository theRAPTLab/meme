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
import PositiveIcon from '@material-ui/icons/Add';
import NegativeIcon from '@material-ui/icons/Clear';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import ADM from '../modules/adm-data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class RatingButton extends React.Component {
  constructor(props) {
    super(props);
    this.OnClick = this.OnClick.bind(this);

    this.state = {
      ratingsDef: ADM.GetRatingsDefintion()
    };
  }

  componentDidMount() { }

  componentWillUnmount() { }

  OnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.OnRatingButtonClick();
  }

  render() {
    const { rating, isExpanded, classes } = this.props;

    const count = Math.abs(rating);
    const icons = [];
    for (let i = 0; i < count; i++) {
      if (rating < 0) {
        icons.push(
          <NegativeIcon className={classes.ratingIconNegative} key={i} fontSize="small" />
        );
      } else if (rating > 0) {
        icons.push(
          <PositiveIcon className={classes.ratingIconPositive} key={i} fontSize="small" />
        );
      } else {
        // leave blank
      }
    }

    const ratingObject = this.state.ratingsDef.find(ro => ro.rating === rating);
    const label = ratingObject ? ratingObject.label : 'Label not found';

    return (
      <Button onClick={this.OnClick}>
        {icons}&nbsp;
        {isExpanded ? label : ''}
      </Button>
    );
  }
}

RatingButton.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  rating: PropTypes.number,
  isExpanded: PropTypes.bool,
  OnRatingButtonClick: PropTypes.func
};

RatingButton.defaultProps = {
  classes: {},
  rating: 0,
  isExpanded: false,
  OnRatingButtonClick: () => {
    console.error('Missing OnRatingButtonClick Handler!');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(RatingButton);
