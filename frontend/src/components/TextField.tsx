// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, required, helperText, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        ref={ref}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-200 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
        } ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      {!error && helperText && <span className="mt-1 block text-xs text-slate-500">{helperText}</span>}
    </label>
  );
});
