import axios from 'axios'

// ---------------------------------------------------------------------------
// Base URL & Supabase Key Configuration
// Read from environment variables (.env)
// ---------------------------------------------------------------------------
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://sxunubxupdxyupnebuid.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_TXg9-r3ZVI8YZMzE90nwsQ_PU9GAmzg'

const IS_SUPABASE =
  BASE_URL.includes('supabase.co') || Boolean(SUPABASE_KEY)

if (!import.meta.env.VITE_API_BASE_URL) {
  console.info(
    '[api] VITE_API_BASE_URL not set in env, using default Supabase instance.',
  )
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})

// ---------------------------------------------------------------------------
// Request interceptor — attach Supabase headers (apikey & Bearer auth)
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    if (IS_SUPABASE && SUPABASE_KEY) {
      config.headers['apikey'] = SUPABASE_KEY
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${SUPABASE_KEY}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Response interceptor — unwrap response and normalise errors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred'
    let status = null

    if (error.response) {
      status = error.response.status
      const rawMsg =
        error.response.data?.message ||
        error.response.data?.msg ||
        error.response.data?.error ||
        error.response.data?.error_description ||
        `Server error (${status})`

      if (typeof rawMsg === 'string') {
        message = rawMsg
      } else if (rawMsg && typeof rawMsg === 'object') {
        message =
          typeof rawMsg.message === 'string'
            ? rawMsg.message
            : typeof rawMsg.msg === 'string'
            ? rawMsg.msg
            : JSON.stringify(rawMsg)
      } else {
        message = `Server error (${status})`
      }
    } else if (error.request) {
      message =
        'Unable to reach the server. Check your connection and try again.'
    } else {
      message = typeof error.message === 'string' ? error.message : String(error || message)
    }

    return Promise.reject({
      message,
      status,
      code: error.response?.data?.code,
      raw: error.response?.data,
    })
  },
)

export { apiClient, BASE_URL, SUPABASE_KEY, IS_SUPABASE }
