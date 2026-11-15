import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Cloud, Download, Trash2, FileText, RefreshCw, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import type { ApiResponse, CloudFile } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CloudFilesPanel() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: files, isLoading, error, refetch } = useQuery({
    queryKey: ['cloudFiles'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CloudFile[]>>('/files/cloud');
      return res.data.data;
    },
    staleTime: 30000,
  });

  async function handleDownload(file: CloudFile) {
    const res = await api.get('/files/cloud/download', {
      params: { path: file.path },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(file: CloudFile) {
    setDeleting(file.path);
    try {
      await api.delete('/files/cloud', { data: { path: file.path } });
      queryClient.invalidateQueries({ queryKey: ['cloudFiles'] });
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    } finally {
      setDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {(error as any)?.response?.status === 503
            ? 'Cloud storage not configured'
            : 'Failed to load cloud files'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
        <Cloud className="h-8 w-8 opacity-30" />
        <p className="text-sm">No files in cloud storage</p>
        <p className="text-xs">Sync files from the local panel to upload them</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''} in cloud
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-0.5 p-1">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(file.size)} · {timeAgo(file.lastModified)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(file)}
                disabled={deleting === file.path}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
