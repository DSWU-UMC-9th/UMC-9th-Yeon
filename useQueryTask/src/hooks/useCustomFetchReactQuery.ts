/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query";

export const useCustomFetchReactQuery = <T>(url: string) => {
  return useQuery({
    queryKey: [url],
    queryFn: async ({ signal }) => {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error();
      return res.json() as Promise<T>;
    },
    retry: 3,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
