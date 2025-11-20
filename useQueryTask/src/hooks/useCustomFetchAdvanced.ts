import { useEffect, useMemo, useRef, useState } from "react";

interface CacheEntry<T> {
  data: T;
  lastFetched: number;
}

const STALE_TIME = 5 * 60 * 1000; // 5분
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export function useCustomFetchAdvanced<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  const storageKey = useMemo(() => url, [url]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    setIsError(false);

    const fetchData = async (currentRetry = 0) => {
      const currentTime = new Date().getTime();
      const cachedItem = localStorage.getItem(storageKey);

      // ✅ 1. 캐시 HIT 확인
      if (cachedItem) {
        try {
          const cachedData: CacheEntry<T> = JSON.parse(cachedItem);

          if (currentTime - cachedData.lastFetched < STALE_TIME) {
            setData(cachedData.data);
            setIsPending(false);
            return;
          }

          // stale이면 화면에 우선 보여주고 백그라운드에서 새로 가져옴
          setData(cachedData.data);
        } catch {
          localStorage.removeItem(storageKey);
        }
      }

      // ✅ 2. 네트워크 요청
      setIsPending(true);

      try {
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const newData = await response.json();
        setData(newData);

        // ✅ 캐시에 저장
        const newCacheEntry: CacheEntry<T> = {
          data: newData,
          lastFetched: new Date().getTime(),
        };
        localStorage.setItem(storageKey, JSON.stringify(newCacheEntry));

        setIsPending(false);
      } catch (error) {
        // ✅ 요청 취소는 정상 처리
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[Fetch Cancelled]");
          return;
        }

        // ✅ 재시도 가능하면 retry
        if (currentRetry < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, currentRetry);
          retryTimeoutRef.current = window.setTimeout(() => fetchData(currentRetry + 1), retryDelay);
        } else {
          setIsError(true);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      // ✅ 컴포넌트 언마운트 시 clean-up
      abortControllerRef.current?.abort();
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [url, storageKey]);

  return { data, isPending, isError };
}
