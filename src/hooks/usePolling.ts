/**
 * usePolling - Custom hook para polling de dados
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TIMEOUTS } from '../constants/api';

export interface UsePollingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

/**
 * Hook genérico para polling de dados
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  onComplete?: (data: T) => void,
  interval: number = TIMEOUTS.POLLING
): UsePollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const startPolling = useCallback(() => {
    if (isPolling) return;
    setIsPolling(true);
    setLoading(true);

    const poll = async () => {
      try {
        const result = await fetcher();
        setData(result);

        // Check se deve parar de fazer poll (ex: status === 'completed')
        if (onComplete) {
          onComplete(result);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao fazer polling';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    // Fazer primeira requisição imediatamente
    poll();

    // Depois fazer polling
    intervalRef.current = setInterval(poll, interval);
  }, [fetcher, onComplete, interval, isPolling]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { data, loading, error, startPolling, stopPolling, isPolling };
}
