import { useState, useEffect, useCallback } from 'react';

export function usePagination(apiListFunc, initialPageSize = 10, enabled = true, extraParams = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('');
  const [totalCount, setTotalCount] = useState(0);

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

  const fetchList = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
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

    apiListFunc(params)
      .then((res) => {
        if (res && res.results !== undefined) {
          setData(res.results);
          setTotalCount(res.count || 0);
        } else if (Array.isArray(res)) {
          setData(res);
          setTotalCount(res.length);
        } else {
          setData([]);
          setTotalCount(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [apiListFunc, page, pageSize, debouncedSearch, ordering, enabled, extraParamsString]);

  useEffect(() => {
    if (enabled) {
      fetchList();
    }
  }, [fetchList, enabled]);

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
    loading,
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
    refresh: fetchList,
    handleSort,
  };
}
