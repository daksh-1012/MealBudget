import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data on mount / when deps change. Ignores out-of-order responses.
export default function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(0);

  const run = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const d = await fn();
      if (id === latest.current) setData(d);
    } catch (e) {
      if (id === latest.current) setError(e.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, setData, loading, error, reload: run };
}
