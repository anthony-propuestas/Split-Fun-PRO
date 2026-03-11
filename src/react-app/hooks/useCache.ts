import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Check memory cache first
    if (!skipCache) {
      const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
      if (cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Check localStorage cache
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsed: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < ttl) {
            setData(parsed.data);
            setLoading(false);
            // Revalidate in background
            fetcher().then((freshData) => {
              const entry = { data: freshData, timestamp: Date.now() };
              memoryCache.set(key, entry);
              localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
              setData(freshData);
            }).catch(() => {});
            return;
          }
        }
      } catch {}
    }

    // Fetch fresh data
    setLoading(true);
    try {
      const freshData = await fetcher();
      const entry = { data: freshData, timestamp: Date.now() };
      memoryCache.set(key, entry);
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch {}
      setData(freshData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
      // Try to use stale cache if available
      const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
      if (cached) {
        setData(cached.data);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch {}
  }, [key]);

  const refetch = useCallback(() => {
    invalidate();
    return fetchData(true);
  }, [invalidate, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, invalidate };
}

// Pre-fetch helper for route preloading
export function prefetch<T>(key: string, fetcher: () => Promise<T>) {
  if (memoryCache.has(key)) return;
  
  fetcher().then((data) => {
    const entry = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch {}
  }).catch(() => {});
}

// Clear all cache
export function clearCache() {
  memoryCache.clear();
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
  keys.forEach(k => localStorage.removeItem(k));
}
