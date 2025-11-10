import React from 'react';
import PropTypes from 'prop-types';
import './label.css';

const Label = ({
  children,
  htmlFor,
  required = false,
  className = ''
}) => {
  const classes = [
    'label',
    className
  ].filter(Boolean).join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
      {required && <span className="label__required">*</span>}
    </label>
  );
};

Label.propTypes = {
  children: PropTypes.node.isRequired,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string
};

export default Label;