import React from 'react';
import { useTheme } from '../ThemeProvider';

export function FormInput({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field"
        style={{
          width: '100%',
          background: colors.background.elevated,
          border: `1px solid ${error ? colors.accent.danger : colors.border.default}`,
          borderRadius: radius.md,
          color: colors.text.primary,
          padding: `${spacing.sm} ${spacing.md}`,
          fontSize: typography.sizes.base,
          fontFamily: typography.fontFamily,
          outline: 'none',
          transition: 'all 200ms ease',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
        }}
        {...props}
      />
      {error && (
        <span
          style={{
            fontSize: typography.sizes.xs,
            color: colors.accent.danger,
            fontFamily: typography.fontFamily,
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default FormInput;
