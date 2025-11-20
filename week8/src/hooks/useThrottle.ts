/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef } from "react";

export function useThrottle<T extends (...args: any[]) => void>(callback: T, interval: number): T {
  const lastExecutedRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = interval - (now - lastExecutedRef.current);

      if (remaining <= 0) {
        // 바로 실행 가능
        lastExecutedRef.current = now;
        callback(...args);
      } else if (timeoutRef.current == null) {
        // 남은 시간이 있을 땐 한 번만 예약
        timeoutRef.current = window.setTimeout(() => {
          lastExecutedRef.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, remaining);
      }
    },
    [callback, interval]
  );

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttled as T;
}