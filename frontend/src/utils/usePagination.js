import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function usePagination(apiListFunc, initialPageSize = 10, enabled = true, extraParams = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('');

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 when search query changes
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  const extraParamsString = JSON.stringify(extraParams);

  // Compute stable query parameters
  const params = {
    page,
    page_size: pageSize,
    ...JSON.parse(extraParamsString)
  };
  if (debouncedSearch) {
    params.search = debouncedSearch;
  }
  if (ordering) {
    params.ordering = ordering;
  }

  // Derive a stable and unique query key for react-query
  const queryKey = ['pagination', apiListFunc.toString(), params];

  const { data: queryData, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => apiListFunc(params),
    enabled: !!enabled,
  });

  // Extract pagination details from response format
  let data = [];
  let totalCount = 0;
  if (queryData) {
    if (queryData.results !== undefined) {
      data = queryData.results;
      totalCount = queryData.count || 0;
    } else if (Array.isArray(queryData)) {
      data = queryData;
      totalCount = queryData.length;
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering('');
    } else {
      setOrdering(field);
    }
  };

  return {
    data,
    loading: isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    ordering,
    setOrdering,
    totalCount,
    totalPages,
    refresh: refetch,
    handleSort,
  };
}
