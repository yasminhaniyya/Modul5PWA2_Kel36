// ---------------------------------------------------------------------------
// queryCache.js — in-memory query cache with TTL & stale-while-revalidate.
//
// Speeds up page transitions by immediately returning cached query results
// when the user moves between pages (e.g., Catalog -> Profile -> Catalog).
// ---------------------------------------------------------------------------

class QueryCache {
  constructor(defaultTtl = 5 * 60 * 1000) {
    this.cache = new Map()
    this.defaultTtl = defaultTtl
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const isStale = now - entry.timestamp > entry.ttl

    return {
      data: entry.data,
      isStale,
      timestamp: entry.timestamp,
    }
  }

  set(key, data, ttl = this.defaultTtl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  has(key) {
    return this.cache.has(key)
  }

  invalidate(keyOrPrefix) {
    if (!keyOrPrefix) {
      this.cache.clear()
      return
    }
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

export const queryCache = new QueryCache()
export default queryCache
