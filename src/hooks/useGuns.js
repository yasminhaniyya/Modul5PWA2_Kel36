import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch }.
// When the API is unreachable the `error` string will be set and `guns`
// will remain an empty array so the UI can show a proper error state.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGuns(params)

      if (response.success) {
        setGuns(response.data || [])
        setPagination(response.pagination || null)
      } else {
        const msg = typeof response.message === 'string'
          ? response.message
          : (response.message?.message || 'Failed to fetch products.')
        setError(msg)
      }
    } catch (err) {
      const msg = typeof err?.message === 'string'
        ? err.message
        : (err?.message?.message || 'An error occurred while fetching products.')
      setError(msg)
      setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch: fetchGuns }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (response.success) {
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: fetchGun }
}
