import { useState, useEffect, useCallback, useRef } from 'react'
import gunService from '../services/gunService'
import queryCache from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API with
// query caching (stale-while-revalidate).
//
// When switching between pages (Catalog -> Profile -> Catalog), data renders
// instantly from the cache without showing a loading spinner.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns_${paramKey}`

  // Initialize from cache if available
  const cached = queryCache.get(cacheKey)
  const [guns, setGuns] = useState(() => (cached ? cached.data.data : []))
  const [loading, setLoading] = useState(() => !cached)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(() => (cached ? cached.data.pagination : null))
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchGuns = useCallback(
    async (force = false) => {
      const entry = queryCache.get(cacheKey)

      // If we have fresh cached data and not forcing a refresh, return immediately
      if (entry && !entry.isStale && !force) {
        setGuns(entry.data.data || [])
        setPagination(entry.data.pagination || null)
        setLoading(false)
        return
      }

      // If no cache, display loading state
      if (!entry) {
        setLoading(true)
      }
      setError(null)

      try {
        const response = await gunService.getGuns(params)

        if (!isMounted.current) return

        if (response.success) {
          queryCache.set(cacheKey, response)
          setGuns(response.data || [])
          setPagination(response.pagination || null)
        } else {
          const msg =
            typeof response.message === 'string'
              ? response.message
              : response.message?.message || 'Failed to fetch products.'
          setError(msg)
        }
      } catch (err) {
        if (!isMounted.current) return
        const msg =
          typeof err?.message === 'string'
            ? err.message
            : err?.message?.message || 'An error occurred while fetching products.'
        setError(msg)
        // If we don't even have cached data, clear guns
        if (!entry) {
          setGuns([])
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramKey, cacheKey],
  )

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  const refetch = useCallback(() => fetchGuns(true), [fetchGuns])

  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID with query caching.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const cacheKey = `gun_detail_${id}`
  const cached = queryCache.get(cacheKey)

  const [gun, setGun] = useState(() => (cached ? cached.data : null))
  const [loading, setLoading] = useState(() => (!cached && Boolean(id)))
  const [error, setError] = useState(null)

  const fetchGun = useCallback(
    async (force = false) => {
      if (!id) {
        setLoading(false)
        return
      }

      const entry = queryCache.get(cacheKey)
      if (entry && !entry.isStale && !force) {
        setGun(entry.data)
        setLoading(false)
        return
      }

      if (!entry) {
        setLoading(true)
      }
      setError(null)

      try {
        const response = await gunService.getGunById(id)
        if (response.success) {
          queryCache.set(cacheKey, response.data)
          setGun(response.data)
        } else {
          setError(response.message || 'Product not found.')
        }
      } catch (err) {
        setError(err.message || 'Failed to load product details.')
        if (!entry) setGun(null)
      } finally {
        setLoading(false)
      }
    },
    [id, cacheKey],
  )

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  const refetch = useCallback(() => fetchGun(true), [fetchGun])

  return { gun, loading, error, refetch }
}

export function invalidateGunsCache() {
  queryCache.invalidate('guns_')
  queryCache.invalidate('gun_detail_')
}
