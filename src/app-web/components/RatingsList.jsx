/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Ratings List

The RatingsList is part of a positive/neutral/negative rating system.

RatingsDialog displays a dialog showing the available types of ratings and
lets the user select a rating.

The RatingsList component actually renders each rating item, including the 
positive/negative icons and the label.

The Ratings List has three Modes:
  * 'edit' -- The labels are editable, used to edit ratings in admin interface
  * 'active' -- The labels can be clicked, used in evidence link rating
  * 'inactive' -- The labels cannot be clicked nor edited, used to display in admin interace

It is opened via an URSYS call, e.g.
    const data = {
      evId: this.props.evlink.evId,
      rating: this.props.evlink.rating
    };
    UR.Publish('RATING:OPEN', data);
    
It relies on the parent object passing props for the ratingsDef (ratings definition)
and setting the mode.

The parent also needs to hand data updates (UpdateField).

Ratings List does not handle its own showing/hiding.  AdmRatingsView and
RatingsDialog does that.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import NegativeIcon from '@material-ui/icons/Clear';
import BlockIcon from '@material-ui/icons/Block';
import PositiveIcon from '@material-ui/icons/Add';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'RatingsDialog:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class RatingsList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { classes, SelectedRating, RatingsDef, Mode, UpdateField, OnRatingSelect } = this.props;

    let ratingsDef = RatingsDef;

    // Pre-render ratings icons
    const icons = {};
    ratingsDef.forEach(def => {
      const n = def.rating;
      const count = Math.abs(n);
      const result = [];
      if (count === 0) {
        // No Rating
        result.push(<BlockIcon className={classes.ratingIconNeutral} key={0} />);
      } else {
        for (let i = 0; i < count; i++) {
          if (n < 0) {
            result.push(<NegativeIcon className={classes.ratingIconNegative} key={i} />);
          } else if (n > 0) {
            result.push(<PositiveIcon className={classes.ratingIconPositive} key={i} />);
          }
        }
      }
      icons[n] = result;
    });

    return (
      <div>
        {ratingsDef.map(def => {
          switch (Mode) {
            case 'edit':
              return (
                <div key={def.rating}>
                  <div style={{ width: '100px', display: 'inline-block' }}>{icons[def.rating]}</div>
                  <TextField
                    value={def.label}
                    placeholder="Label"
                    onChange={e => UpdateField(def.rating, e.target.value)}
                  />
                </div>
              );
              break;
            case 'active':
              return (
                <Button
                  key={def.label}
                  style={{ width: '300px' }}
                  onClick={e => OnRatingSelect(e, def.rating)}
                  color="primary"
                  variant={SelectedRating === String(def.rating) ? 'contained' : 'text'}
                >
                  <div style={{ width: '100px' }}>{icons[def.rating]}</div>
                  <div style={{ width: '200px', textAlign: 'left' }}>{def.label}</div>
                </Button>
              );
              break;
            case 'inactive':
            default:
              return (
                <div key={def.rating}>
                  <div style={{ width: '100px', display: 'inline-block' }}>{icons[def.rating]}</div>
                  <div style={{ width: '200px', textAlign: 'left', display: 'inline-block' }}>
                    {def.label}
                  </div>
                </div>
              );
              break;
          }
        })}
      </div>
    );
  }
}

RatingsList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  SelectedRating: PropTypes.string, // optional
  RatingsDef: PropTypes.array,
  Mode: PropTypes.string,
  UpdateField: PropTypes.func,
  OnRatingSelect: PropTypes.func // optional
};

RatingsList.defaultProps = {
  classes: {},
  SelectedRating: '',
  RatingsDef: [],
  Mode: 'inactive',
  UpdateField: () => {
    console.error('Missing UpdateField handler');
  },
  OnRatingSelect: () => {
    console.error('OnRatingSelect handler not defined (but optional)');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(RatingsList);
