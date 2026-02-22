/**
 * useFetch - Custom hook genérico para fetching de dados (DRY principle)
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook genérico para buscar dados
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  autoFetch: boolean = true
): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, deps);

  return { data, loading, error, refetch };
}
