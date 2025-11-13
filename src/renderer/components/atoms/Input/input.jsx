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

  // CORRECCIÓN DEFINITIVA: 
  // 1. Coerción a cadena vacía si es null/undefined.
  // 2. Coerción explícita a String() para valores numéricos (como 0 o list_number) 
  //    que pueden causar el bug en inputs controlados.
  const finalValue = value === null || value === undefined ? '' : String(value);

  return (
    <div className="input-wrapper">
      {icon && <span className="input__icon">{icon}</span>}
      <input
        type={type}
        name={name}
        // Usa el valor corregido y forzado a String
        value={finalValue} 
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
  // Permite string o number (incluido el valor de 0)
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