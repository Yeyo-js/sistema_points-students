import React from 'react';
import PropTypes from 'prop-types';
import Label from '../../atoms/label';
import Input from '../../atoms/input';
import PasswordInput from '../passwordInput';
import './formField.css';

const FormField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon = null,
  autoComplete,
  maxLength,
  min,
  max,
  className = ''
}) => {
  const isPasswordField = type === 'password';

  const sanitizedValue = (value === null || value === undefined) ? '' : value;

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      
      {isPasswordField ? (
        <PasswordInput
          name={name}
          value={sanitizedValue}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          error={!!error}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
        />
      ) : (
        <Input
          type={type}
          name={name}
          value={sanitizedValue}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          error={!!error}
          disabled={disabled}
          icon={icon}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
        />
      )}
      
      {error && (
        <span className="form-field__error">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
};

export default FormField;