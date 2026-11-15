import { useState } from 'react';
import {
  FolderOpen, FilePlus, RefreshCw, Cloud, AlertTriangle, Upload,
  HardDrive, Clock, ArrowLeft,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FolderTree from '@/components/files/FolderTree';
import FileViewer from '@/components/files/FileViewer';
import CreateFileDialog from '@/components/files/CreateFileDialog';
import CloudFilesPanel from '@/components/files/CloudFilesPanel';
import SyncHistory from '@/components/files/SyncHistory';
import { useFileSystem, type FileEntry } from '@/hooks/useFileSystem';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import type { ApiResponse, SyncStatus } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FileManager() {
  const fs = useFileSystem();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [viewingFile, setViewingFile] = useState<FileEntry | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SyncStatus>>('/files/sync/status');
      return res.data.data;
    },
    retry: false,
    staleTime: 60000,
  });

  function handleSelect(entry: FileEntry) {
    setSelectedEntry(entry);
    if (entry.kind === 'file') {
      setViewingFile(entry);
    }
  }

  async function handleCreateFile(parentPath: string, fileName: string) {
    await fs.createFile(parentPath, fileName);
  }

  async function handleSyncFile(entry: FileEntry) {
    if (entry.kind !== 'file') return;
    setSyncing(true);
    setSyncMessage('');
    try {
      const file = await fs.getFileBlob(entry);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('relativePath', entry.path);
      await api.post('/files/sync', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSyncMessage(`Synced: ${entry.name}`);
      queryClient.invalidateQueries({ queryKey: ['cloudFiles'] });
      queryClient.invalidateQueries({ queryKey: ['syncHistory'] });
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    } catch (err: any) {
      setSyncMessage(
        err.response?.data?.error || 'Sync failed — check cloud configuration'
      );
    } finally {
      setSyncing(false);
    }
  }

  const selectedDirPath =
    selectedEntry?.kind === 'directory'
      ? selectedEntry.path
      : selectedEntry?.path.includes('/')
        ? selectedEntry.path.substring(0, selectedEntry.path.lastIndexOf('/'))
        : '';

  if (!fs.isSupported) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-10 w-10 text-destructive" />
            <CardTitle>Browser Not Supported</CardTitle>
            <CardDescription>
              The File System Access API requires a Chromium-based browser (Chrome, Edge, or Brave).
              Please open OneHub in one of these browsers to use the File Manager.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!fs.hasAccess) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Local File Access</CardTitle>
            <CardDescription className="mx-auto max-w-md">
              Grant access to a local folder to browse, create, and edit files.
              Your files stay private — access requires your explicit permission.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={fs.requestAccess}
              disabled={fs.loading}
            >
              <FolderOpen className="h-4 w-4" />
              {fs.loading ? 'Opening...' : 'Allow Folder Access'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Uses the File System Access API. Works in Chrome, Edge, and Brave.
            </p>
            {fs.error && (
              <p className="text-xs text-destructive">{fs.error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          <span className="truncate text-sm font-medium">{fs.rootName}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
            aria-label="Create new file"
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New File</span>
          </Button>
          {viewingFile && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleSyncFile(viewingFile)}
              disabled={syncing}
              aria-label={`Sync ${viewingFile.name} to cloud`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync to Cloud'}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fs.refresh}
            disabled={fs.loading}
            aria-label="Refresh file tree"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fs.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className="text-xs text-muted-foreground">{syncMessage}</span>
          )}
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {syncStatus?.connected ? (
              <>
                Cloud: Connected
                {syncStatus.totalFiles > 0 && (
                  <span className="ml-1 opacity-70">
                    ({syncStatus.totalFiles} files, {formatBytes(syncStatus.totalSize)})
                  </span>
                )}
              </>
            ) : (
              'Cloud: Not configured'
            )}
          </Badge>
        </div>
      </div>

      {/* Main content: tree + viewer + cloud panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - folder tree (hidden on mobile when viewing a file) */}
        <div className={cn(
          'w-full shrink-0 border-r md:w-60',
          viewingFile ? 'hidden md:block' : 'block'
        )}>
          <ScrollArea className="h-full">
            <FolderTree
              entries={fs.entries}
              selectedPath={selectedEntry?.path ?? null}
              onSelect={handleSelect}
              onToggle={fs.expandDirectory}
            />
          </ScrollArea>
        </div>

        {/* Center - file viewer/editor (full width on mobile) */}
        <div className={cn(
          'flex-1 overflow-hidden',
          viewingFile ? 'block' : 'hidden md:block'
        )}>
          {viewingFile ? (
            <div className="flex h-full flex-col">
              {/* Mobile back button */}
              <div className="flex items-center gap-2 border-b px-3 py-1.5 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setViewingFile(null)}
                  aria-label="Back to file tree"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <FileViewer
                  entry={viewingFile}
                  onRead={fs.readFile}
                  onWrite={fs.writeFile}
                  onClose={() => setViewingFile(null)}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FolderOpen className="h-10 w-10 opacity-30" />
              <p className="text-sm">Select a file to view or edit</p>
            </div>
          )}
        </div>

        {/* Right sidebar - cloud panel */}
        <div className="hidden w-72 shrink-0 border-l lg:block">
          <Tabs defaultValue="cloud" className="flex h-full flex-col">
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
              <TabsTrigger value="cloud" className="gap-1.5 text-xs">
                <HardDrive className="h-3 w-3" />
                Cloud Files
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs">
                <Clock className="h-3 w-3" />
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cloud" className="mt-0 flex-1 overflow-hidden">
              <CloudFilesPanel />
            </TabsContent>
            <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
              <SyncHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateFileDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentPath={selectedDirPath}
        onCreate={handleCreateFile}
      />
    </div>
  );
}
