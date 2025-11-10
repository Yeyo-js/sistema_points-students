import React from 'react';
import PropTypes from 'prop-types';
import './input.css';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  error = false,
  icon = null,
  className = '',
  autoComplete,
  required = false,
  maxLength,
  min,
  max
}) => {
  const classes = [
    'input',
    error && 'input--error',
    disabled && 'input--disabled',
    icon && 'input--with-icon',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-wrapper">
      {icon && <span className="input__icon">{icon}</span>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={classes}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
      />
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
  autoComplete: PropTypes.string,
  required: PropTypes.bool,
  maxLength: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Input;