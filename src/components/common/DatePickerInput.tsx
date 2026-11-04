import React from 'react';
import { toDateInputValue, fromDateInputValue } from '../../utils/formatters';

interface DatePickerInputProps {
  value: string;
  onChange: (date: string) => void;
  outputFormat?: 'DD-MM-YYYY' | 'YYYY-MM-DD';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  outputFormat = 'DD-MM-YYYY',
  required = false,
  disabled = false,
  className = '',
  placeholder,
  id,
  name,
  min,
  max,
}) => {
  const htmlDateValue = toDateInputValue(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value; // In YYYY-MM-DD format
    if (!rawValue) {
      onChange('');
      return;
    }
    const formatted = fromDateInputValue(rawValue, outputFormat);
    onChange(formatted);
  };

  return (
    <input
      type="date"
      id={id}
      name={name}
      required={required}
      disabled={disabled}
      min={min ? toDateInputValue(min) : undefined}
      max={max ? toDateInputValue(max) : undefined}
      value={htmlDateValue}
      onChange={handleChange}
      placeholder={placeholder || (outputFormat === 'DD-MM-YYYY' ? 'dd/mm/yyyy' : 'yyyy-mm-dd')}
      className={`cursor-pointer ${className}`}
    />
  );
};
