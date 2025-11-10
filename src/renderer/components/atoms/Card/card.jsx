import React from 'react';
import PropTypes from 'prop-types';
import './card.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  className = ''
}) => {
  const classes = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  className: PropTypes.string
};

export default Card;