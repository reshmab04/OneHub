import { useQuery } from '@tanstack/react-query';
import { Upload, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import type { ApiResponse, SyncHistoryEntry } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SyncHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['syncHistory'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SyncHistoryEntry[]>>('/files/sync/history');
      return res.data.data;
    },
    staleTime: 10000,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
        <Clock className="h-8 w-8 opacity-30" />
        <p className="text-sm">No sync activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[250px]">
      <div className="space-y-0.5 p-1">
        {history.map((entry, i) => (
          <div
            key={`${entry.path}-${entry.timestamp}-${i}`}
            className="flex items-start gap-2 rounded-md px-2 py-1.5"
          >
            {entry.action === 'upload' ? (
              <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            ) : (
              <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{entry.path}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(entry.timestamp)}
                </span>
                {entry.status === 'synced' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive" />
                )}
                {entry.error && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">
                    {entry.error.slice(0, 30)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
