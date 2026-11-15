import { Star, GitFork, Circle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Repository } from '@/types';

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Lua: '#000080',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Scala: '#c22d40',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function RepoCard({ repo }: { repo: Repository }) {
  return (
    <Card className="transition-colors hover:bg-accent/30" role="article" aria-label={`${repo.owner}/${repo.name}`}>
      <CardContent className="flex items-start gap-4 p-4">
        <img
          src={repo.ownerAvatar}
          alt={repo.owner}
          className="h-10 w-10 shrink-0 rounded-full border bg-muted"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                <span className="text-muted-foreground">{repo.owner}/</span>
                <span className="truncate">{repo.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              <Star className="mr-1 h-3 w-3" />
              {formatNumber(repo.stars)}
            </Badge>
          </div>

          {repo.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {repo.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <Circle
                  className="h-2.5 w-2.5"
                  fill={languageColors[repo.language] || '#888'}
                  stroke="none"
                />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              {formatNumber(repo.forks)}
            </span>
            <span>Created {timeAgo(repo.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
