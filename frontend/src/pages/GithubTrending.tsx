import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RepoCard from '@/components/github/RepoCard';
import LanguageFilter from '@/components/github/LanguageFilter';
import api from '@/services/api';
import type { Repository, ApiResponse } from '@/types';

const REFETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

function RepoSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GithubTrending() {
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    setDebounceTimer(timer);
  }

  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['trending', language, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (language) params.set('language', language);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await api.get<ApiResponse<Repository[]>>(
        `/github/trending?${params.toString()}`
      );
      return res.data;
    },
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 5 * 60 * 1000,
  });

  const repos = data?.data ?? [];
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Discover trending repositories created in the last 7 days
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search repositories"
          />
        </div>
        <LanguageFilter value={language} onChange={setLanguage} />
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {lastUpdated && <span>Last updated: {lastUpdated}</span>}
        <Badge variant="secondary" className="text-xs">
          Auto-refresh: 30m
        </Badge>
        {!isLoading && (
          <span>
            {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
          </span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/50 bg-destructive/10" role="alert">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Failed to load trending repos</p>
              <p className="text-xs text-muted-foreground">
                {(error as any)?.response?.data?.error ||
                  (error as Error)?.message ||
                  'Check your connection and try again.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RepoSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && repos.length > 0 && (
        <div className="grid gap-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && repos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium">No repositories found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or language filter.
          </p>
        </div>
      )}
    </div>
  );
}
