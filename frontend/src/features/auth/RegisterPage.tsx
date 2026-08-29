// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from './AuthContext';

const schema = z.object({
  organizationName: z.string().min(2, 'Must be 2-80 characters').max(80, 'Must be 2-80 characters'),
  name: z.string().min(1, 'Your name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(10, 'Must be at least 10 characters')
    .regex(/\d/, 'Must contain at least 1 number'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerOrg } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = watch('password') ?? '';
  const strength = password.length >= 14 ? 'Strong' : password.length >= 10 ? 'Good' : 'Weak';

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await registerOrg(values);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'DUPLICATE_NAME') {
        setFormError('An account with this email already exists — try signing in instead.');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Create your organization</h1>
        <p className="mt-1 text-sm text-slate-500">Start tracking campaign delivery in minutes</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}{' '}
              {formError.includes('already exists') && (
                <Link to="/login" className="font-medium underline">
                  Sign in
                </Link>
              )}
            </div>
          )}
          <TextField
            label="Organization name"
            required
            error={errors.organizationName?.message}
            {...register('organizationName')}
          />
          <TextField label="Your name" required error={errors.name?.message} {...register('name')} />
          <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <div>
            <TextField
              label="Password"
              type="password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            {password.length > 0 && !errors.password && (
              <span className="mt-1 block text-xs text-slate-500">Strength: {strength}</span>
            )}
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create organization
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
