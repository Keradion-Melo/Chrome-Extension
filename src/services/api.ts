import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getAuthToken, getRefreshToken, setTokens, clearTokens } from './tokenService';
import { store } from '../store/store';
import { logout as logoutAction } from '../store/slices/userSlice';

const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
const baseURL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const isExtensionContext = (): boolean => {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id && typeof chrome.runtime?.sendMessage === 'function';
  } catch {
    return false;
  }
};

// Background message fetch bridge for Chrome extension to bypass host-page CSP / CORS / Private Network restrictions
const backgroundFetch = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    let targetUrl = config.url || '';
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `${baseURL}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
    }

    const payload = {
      url: targetUrl,
      method: (config.method || 'GET').toUpperCase(),
      headers: config.headers || {},
      data: config.data,
      params: config.params,
    };

    try {
      chrome.runtime.sendMessage({ type: 'API_REQUEST', payload }, (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res || res.success === false) {
          const error: any = new Error(res?.data?.message || res?.error || 'Request failed');
          error.response = {
            status: res?.status || 500,
            data: res?.data || { message: res?.error || 'Request failed' },
          };
          reject(error);
        } else {
          resolve({
            data: res.data,
            status: res.status,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const directAxios = axios.create({
  baseURL,
  timeout: 30000,
});

class ApiService {
  public async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // 1. Attach auth token
    const token = await getAuthToken();
    const headers = { ...(config.headers || {}) };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const finalConfig: AxiosRequestConfig = { ...config, headers };

    try {
      if (isExtensionContext()) {
        return await backgroundFetch(finalConfig);
      }
      return await directAxios(finalConfig);
    } catch (error: any) {
      // 2. Handle 401 token refresh
      if (error?.response?.status === 401) {
        if (config.url?.includes('/auth/refresh')) {
          await clearTokens();
          store.dispatch(logoutAction());
          return Promise.reject(error);
        }

        try {
          const currentRefreshToken = await getRefreshToken();
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const refreshConfig: AxiosRequestConfig = {
            url: '/auth/refresh',
            method: 'POST',
            data: { refreshToken: currentRefreshToken },
          };

          const refreshResponse = isExtensionContext()
            ? await backgroundFetch(refreshConfig)
            : await directAxios(refreshConfig);

          const data = refreshResponse.data?.data || refreshResponse.data;
          const accessToken = data.accessToken || data.access_token;
          const newRefreshToken = data.refreshToken || data.refresh_token || currentRefreshToken;

          if (accessToken) {
            await setTokens(accessToken, newRefreshToken);
            finalConfig.headers = {
              ...finalConfig.headers,
              Authorization: `Bearer ${accessToken}`,
            };
            if (isExtensionContext()) {
              return await backgroundFetch(finalConfig);
            }
            return await directAxios(finalConfig);
          }
        } catch (refreshErr) {
          await clearTokens();
          store.dispatch(logoutAction());
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const api = new ApiService();
export default api;
