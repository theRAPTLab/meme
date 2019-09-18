/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

RatingButton

The RatingButton is part of a positive/neutral/negative rating system.

The RatingButton is primarily a display component.  It's main purpose is 
display the currently selected rating.

It handles a click request to change the rating, passing off the 
update to RatingsDialog.jsx.

Features:
* Any number of ratings can be set
* Supports an expanded and collasped (minified) view.

      
RATIONALE

The goal is to make this a generalized component that can be used in 
various different circumstances.  So we rely on props calls to communicate
with the parent component.

Props:
    FROM Parent
      *   ratingsDefs     value
      *   rating          value
      *   isExpanded      display setting
    TO Parent
      *   OnRatingButtonClick


ratingsDefs looks like this:
    [
      { label: 'Really disagrees!', rating: -3 },
      { label: 'Kinda disagrees!', rating: -2 },
      { label: 'Disagrees a little', rating: -1 },
      { label: 'Not rated / Irrelevant', rating: 0 },
      { label: 'Weak support', rating: 1 },
      { label: 'Medium support', rating: 2 },
      { label: 'Rocks!!', rating: 3 }
    ]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
// Material UI Icons
import NegativeIcon from '@material-ui/icons/Clear';
import BlockIcon from '@material-ui/icons/Block';
import PositiveIcon from '@material-ui/icons/Add';
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
  }

  componentDidMount() { }

  componentWillUnmount() { }

  OnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.OnRatingButtonClick();
  }

  render() {
    const { rating, isExpanded, classes, ratingDefs } = this.props;

    const count = Math.abs(rating);
    const icons = [];
    if (count === 0) {
      // No Rating
      icons.push(<BlockIcon className={classes.ratingIconNeutral} key={0} fontSize="small" />);
    } else {
      for (let i = 0; i < count; i++) {
        if (rating < 0) {
          icons.push(
            <NegativeIcon className={classes.ratingIconNegative} key={i} fontSize="small" />
          );
        } else if (rating > 0) {
          icons.push(
            <PositiveIcon className={classes.ratingIconPositive} key={i} fontSize="small" />
          );
        }
      }
    }

    const ratingObject = ratingDefs.find(ro => ro.rating === rating);
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
  ratingDefs: PropTypes.array,
  OnRatingButtonClick: PropTypes.func
};

RatingButton.defaultProps = {
  classes: {},
  rating: 0,
  isExpanded: false,
  ratingDefs: [],
  OnRatingButtonClick: () => {
    console.error('Missing OnRatingButtonClick Handler!');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(RatingButton);
