import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, GitCompare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ModelCard from '@/components/models/ModelCard';
import CompareModal from '@/components/models/CompareModal';
import api from '@/services/api';
import type { AIModel, ApiResponse } from '@/types';

const categories = [
  'All',
  'Writing',
  'Coding',
  'Thinking & Reasoning',
  'Text Generation',
  'Image Generation',
];

function ModelSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIModels() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [compareList, setCompareList] = useState<AIModel[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AIModel[]>>('/models');
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const allModels = data?.data ?? [];

  const filteredModels = useMemo(() => {
    let result = allModels;

    if (activeCategory !== 'All') {
      result = result.filter((m) =>
        m.categories.some((c) => c.toLowerCase() === activeCategory.toLowerCase())
      );
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allModels, activeCategory, search]);

  function toggleCompare(model: AIModel) {
    setCompareList((prev) => {
      const exists = prev.find((m) => m.id === model.id);
      if (exists) return prev.filter((m) => m.id !== model.id);
      if (prev.length >= 4) return prev;
      return [...prev, model];
    });
  }

  function removeFromCompare(model: AIModel) {
    setCompareList((prev) => prev.filter((m) => m.id !== model.id));
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Discover, compare, and evaluate AI models across categories
        </p>
        <Button
          variant={compareList.length > 0 ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          disabled={compareList.length < 2}
          onClick={() => setCompareOpen(true)}
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare ({compareList.length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models by name or provider..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search AI models"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
          {activeCategory !== 'All' && ` in ${activeCategory}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium">Failed to load models</p>
              <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ModelSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Model grid */}
      {!isLoading && !isError && filteredModels.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={compareList.some((m) => m.id === model.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredModels.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium">No models found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        models={compareList}
        onRemove={removeFromCompare}
      />
    </div>
  );
}
