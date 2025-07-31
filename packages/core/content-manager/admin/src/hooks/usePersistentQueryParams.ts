import { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

const getQueryParams = (search: string) => {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
};

export const usePersistentQueryParams = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const localStorageKey = `strapi-query-params:${pathname}`;

  useEffect(() => {
    const currentParams = getQueryParams(search);
    const hasCurrentParams = currentParams && currentParams.size > 0;

    const savedQueryParams = window.localStorage.getItem(localStorageKey);

    if (!hasCurrentParams && savedQueryParams !== null) {
      // No query params in the URL – check localStorage
      const savedParams = getQueryParams(savedQueryParams);
      if (savedParams && savedParams.size > 0) {
        navigate(
          {
            pathname,
            search: savedQueryParams,
          },
          {
            replace: true,
          }
        );
      }
    } else if (hasCurrentParams) {
      // Save current query params
      window.localStorage.setItem(localStorageKey, currentParams.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorageKey, search]);
};
