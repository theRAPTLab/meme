import React from 'react';
import PropTypes from 'prop-types';
import DEFAULTS from '../modules/defaults';

const { COLOR } = DEFAULTS;

const SVG = ({
  orientation = 'right',
  disabled = false,
  style = {},
  stroke = '',
  fill = COLOR.MECH,
  width = '',
  className = '',
  viewBox = '-1 0 6 4'
}) => {
  const strokeWidth = '0.5';
  // disabled
  const pathFill = disabled ? 'none' : fill;
  const pathStroke = disabled ? '#000' : stroke;
  const strokeOpacity = disabled ? '0.1' : '0';
  // orientation
  let transform = 'rotate(180 2 2)';
  if (orientation === 'right') {
    transform = '';
  }
  return (
    <svg
      width={width}
      style={style}
      height={width}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-icon ${className || ''}`}
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <path
        stroke={pathStroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        strokeLinejoin="miter"
        strokeMiterlimit="8"
        fill={pathFill}
        transform={transform}
        d="M0,0 L0,4 L4,2 Z"
      />
    </svg>
  );
};

SVG.defaultProps = {
  orientation: 'right',
  disabled: false,
  style: {},
  stroke: '',
  fill: COLOR.MECH,
  width: '40px',
  className: '',
  viewBox: '-1 0 6 4' // hack to get around outer stroke and miter limits, should be '0 0 4 4'
};

SVG.propTypes = {
  orientation: PropTypes.string,
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
  stroke: PropTypes.string,
  fill: PropTypes.string,
  width: PropTypes.string,
  className: PropTypes.string,
  viewBox: PropTypes.string
};

export default SVG;
