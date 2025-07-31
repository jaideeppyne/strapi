import React, { useEffect, useState } from 'react';

export const usePersistentState = <T>(
  key: string,
  model: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [data, setData] = useState<T>(defaultValue);
  const localStorageKey = `strapi-${key}:${model}`;

  useEffect(() => {
    const savedData = window.localStorage.getItem(localStorageKey);

    if (savedData !== null) {
      const parsedData = JSON.parse(savedData) as T;
      setData(parsedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return [data, setData];
};
