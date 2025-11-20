import { useEffect, useState } from "react";

export const useCustomFetchBasic = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    };
    fetchData();
  }, [url]);

  return { data };
};
