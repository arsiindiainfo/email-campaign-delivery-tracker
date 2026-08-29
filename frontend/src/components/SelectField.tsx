// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, required, className = '', children, ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select
        ref={ref}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-200 ${
          error ? 'border-red-400' : 'border-slate-300 focus:border-indigo-500'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});
