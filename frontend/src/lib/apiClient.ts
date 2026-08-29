// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ErrorDetail, ErrorEnvelope, Paginated, SuccessEnvelope } from '../types/api';
import { tokenStorage } from './tokenStorage';

export class ApiError extends Error {
  code: string;
  details?: ErrorDetail[];
  status?: number;

  constructor(code: string, message: string, details?: ErrorDetail[], status?: number) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

export const axiosClient = axios.create({ baseURL });

axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('UNAUTHORIZED', 'No refresh token available');
  }
  const response = await axios.post<SuccessEnvelope<{ accessToken: string; refreshToken: string }>>(
    `${baseURL}/auth/refresh`,
    { refreshToken },
  );
  const tokens = response.data.data;
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
        return axiosClient.request(originalRequest);
      } catch {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const envelope = error.response?.data;
    if (envelope && !envelope.success) {
      throw new ApiError(envelope.error.code, envelope.error.message, envelope.error.details, error.response?.status);
    }
    throw new ApiError('NETWORK_ERROR', error.message);
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosClient.get<SuccessEnvelope<T>>(url, config);
  return response.data.data;
}

export async function apiGetPaginated<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
  const response = await axiosClient.get<SuccessEnvelope<T[]>>(url, config);
  return { data: response.data.data, meta: response.data.meta! };
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosClient.post<SuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosClient.put<SuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosClient.delete<SuccessEnvelope<T>>(url, config);
  return response.data.data;
}
