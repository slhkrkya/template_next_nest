import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'

// ... In-memory token store ...
// Tokens are kept in module scope (not localStorage) to avoid XSS exposure.
// The auth Zustand store also holds the token; this module mirrors it so the
// axios interceptor can read it synchronously without importing the store
// (which would create a circular dependency).

let _accessToken: string | null = null

export function setAxiosAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAxiosAccessToken(): string | null {
  return _accessToken
}

// ... Refresh state ...

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token as string)
    }
  })
  failedQueue = []
}

function getCurrentLocale(): string {
  if (typeof document === 'undefined') return 'en'

  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : 'en'
}

// ... Axios instance ...

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true, // send httpOnly refresh-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// ... Request interceptor ...

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = _accessToken
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    if (config.headers) {
      config.headers['Accept-Language'] = getCurrentLocale()
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ... Response interceptor ...

axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response.data as { success?: boolean; data?: unknown } | undefined
    if (payload?.success === true && 'data' in payload) {
      response.data = payload.data
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    // Only intercept 401s that are not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
            }
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axiosInstance.post<{ accessToken: string }>(
          '/auth/refresh',
          {},
          { withCredentials: true },
        )

        const newToken = data.accessToken
        setAxiosAccessToken(newToken)

        // Sync with the auth store without importing it (avoids circular dep)
        // The store's setAuth action will also call setAxiosAccessToken;
        // here we update the local mirror directly so queued requests get it.
        processQueue(null, newToken)

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        }

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        setAxiosAccessToken(null)

        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
