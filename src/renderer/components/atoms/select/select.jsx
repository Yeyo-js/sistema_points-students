import React from 'react';
import PropTypes from 'prop-types';
import './select.css';

const Select = ({
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  error = false,
  icon = null,
  className = '',
  required = false
}) => {
  const classes = [
    'select',
    error && 'select--error',
    disabled && 'select--disabled',
    icon && 'select--with-icon',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="select-wrapper">
      {icon && <span className="select__icon">{icon}</span>}
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={classes}
        required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="select__arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  );
};

Select.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
  required: PropTypes.bool
};

export default Select;