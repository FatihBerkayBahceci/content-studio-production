// =====================================================================
// SEO TOOL SUITE - API CLIENT
// Enhanced with retry, timeout, and error handling
// =====================================================================

// Use Next.js API proxy to avoid CORS issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/n8n';

// =====================================================================
// Configuration
// =====================================================================

export interface APIClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
  /** Maximum delay between retries in ms (default: 10000) */
  maxRetryDelay?: number;
  /** HTTP status codes that should trigger a retry */
  retryStatusCodes?: number[];
}

const DEFAULT_CONFIG: Required<Omit<APIClientConfig, 'baseUrl'>> = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

// =====================================================================
// Error Classes
// =====================================================================

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
    public isRetryable: boolean = false
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'APIError';
  }

  static fromResponse(response: Response, body?: unknown): APIError {
    const isRetryable = DEFAULT_CONFIG.retryStatusCodes.includes(response.status);
    return new APIError(response.status, response.statusText, body, isRetryable);
  }
}

export class TimeoutError extends Error {
  constructor(public timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(public originalError: Error) {
    super(`Network error: ${originalError.message}`);
    this.name = 'NetworkError';
  }
}

// =====================================================================
// Request Options
// =====================================================================

interface RequestOptions extends Omit<RequestInit, 'signal'> {
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request timeout in ms (overrides client default) */
  timeout?: number;
  /** Number of retries (overrides client default) */
  retries?: number;
  /** Skip retry logic for this request */
  noRetry?: boolean;
  /** Abort signal */
  signal?: AbortSignal;
}

// =====================================================================
// API Client Class
// =====================================================================

class APIClient {
  private config: Required<APIClientConfig>;

  constructor(config: APIClientConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: RequestOptions['params']): string {
    let fullPath = `${this.config.baseUrl}${path.startsWith('/') ? path : '/' + path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullPath += `?${queryString}`;
      }
    }

    return fullPath;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private getRetryDelay(attempt: number, baseDelay: number, maxDelay: number): number {
    // Exponential backoff: delay = baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    // Add jitter (random 0-25% of delay)
    const jitter = exponentialDelay * Math.random() * 0.25;
    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number, controller: AbortController): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new TimeoutError(timeout));
      }, timeout);
    });
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout<T>(
    url: string,
    fetchOptions: RequestInit,
    timeout: number,
    externalSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();

    // Link external signal if provided
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }

    const fetchPromise = fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    const timeoutPromise = this.createTimeoutPromise(timeout, controller);

    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new Error('Request was aborted');
        }
        throw new TimeoutError(timeout);
      }
      throw new NetworkError(error as Error);
    }
  }

  /**
   * Main request method with retry logic
   */
  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      params,
      timeout = this.config.timeout,
      retries = this.config.retries,
      noRetry = false,
      signal,
      ...fetchOptions
    } = options;

    const url = this.buildUrl(path, params);
    const maxAttempts = noRetry ? 1 : retries + 1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.executeWithTimeout(
          url,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
            ...fetchOptions,
          },
          timeout,
          signal
        );

        // Parse response
        const text = await response.text();
        let body: unknown;

        try {
          body = text ? JSON.parse(text) : {};
        } catch {
          body = text;
        }

        // Handle non-OK responses
        if (!response.ok) {
          const error = APIError.fromResponse(response, body);

          // Check if we should retry
          if (error.isRetryable && attempt < maxAttempts - 1) {
            lastError = error;
            const delay = this.getRetryDelay(
              attempt,
              this.config.retryDelay,
              this.config.maxRetryDelay
            );
            console.warn(
              `[API] Request failed with ${response.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})`
            );
            await this.sleep(delay);
            continue;
          }

          throw error;
        }

        return body as T;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof TimeoutError || error instanceof NetworkError) {
          if (attempt < maxAttempts - 1) {
            const delay = this.getRetryDelay(
              attempt,
              this.config.retryDelay,
              this.config.maxRetryDelay
            );
            console.warn(
              `[API] ${error.name}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})`
            );
            await this.sleep(delay);
            continue;
          }
        }

        // Don't retry on abort or non-retryable errors
        if (
          (error instanceof Error && error.message === 'Request was aborted') ||
          (error instanceof APIError && !error.isRetryable)
        ) {
          throw error;
        }

        // Last attempt failed
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error('Unknown error');
  }

  // =====================================================================
  // HTTP Methods
  // =====================================================================

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}

// =====================================================================
// Singleton Instance
// =====================================================================

export const api = new APIClient({
  baseUrl: API_BASE_URL,
  timeout: 30000,      // 30 seconds default timeout
  retries: 3,          // 3 retry attempts
  retryDelay: 1000,    // 1 second initial delay
  maxRetryDelay: 10000, // 10 seconds max delay
});

// Re-export for convenience
export { API_BASE_URL };

// =====================================================================
// Utility Functions
// =====================================================================

/**
 * Create a new API client with custom configuration
 */
export function createAPIClient(config: APIClientConfig): APIClient {
  return new APIClient(config);
}

/**
 * Helper to check if an error is an API error
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Helper to check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Helper to check if an error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Extract error message from API error response
 */
export function getAPIErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    // Try to extract message from body
    if (error.body && typeof error.body === 'object') {
      const body = error.body as Record<string, unknown>;
      if (typeof body.error === 'string') return body.error;
      if (typeof body.message === 'string') return body.message;
      if (Array.isArray(body.details)) return body.details.join(', ');
    }
    return `${error.status} ${error.statusText}`;
  }
  if (isTimeoutError(error)) {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  if (isNetworkError(error)) {
    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Beklenmeyen bir hata oluştu';
}
