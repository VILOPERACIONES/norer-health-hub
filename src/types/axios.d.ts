import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipRetry?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipRetry?: boolean;
  }
}
