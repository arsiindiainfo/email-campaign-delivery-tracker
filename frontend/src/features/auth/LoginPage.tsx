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
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await login(values);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Invalid email or password');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Email Campaign & Delivery Tracking Platform</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          {formError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <TextField
            label="Password"
            type="password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
