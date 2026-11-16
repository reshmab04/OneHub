import { useState, useMemo } from 'react';
import {
  FolderOpen, FilePlus, RefreshCw, Cloud, AlertTriangle, Upload,
  HardDrive, Clock, ArrowLeft, Search, FolderTree as FolderIcon,
  FileText, Layers, X,
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

function flattenEntries(entries: FileEntry[]): FileEntry[] {
  const result: FileEntry[] = [];
  function walk(items: FileEntry[]) {
    for (const item of items) {
      result.push(item);
      if (item.children) walk(item.children);
    }
  }
  walk(entries);
  return result;
}

function filterTree(entries: FileEntry[], query: string): FileEntry[] {
  const q = query.toLowerCase();
  function matches(entry: FileEntry): boolean {
    if (entry.name.toLowerCase().includes(q)) return true;
    if (entry.children) return entry.children.some(matches);
    return false;
  }
  function prune(items: FileEntry[]): FileEntry[] {
    return items
      .filter(matches)
      .map((item) => {
        if (!item.children) return item;
        return { ...item, children: prune(item.children), expanded: true };
      });
  }
  return prune(entries);
}

export default function FileManager() {
  const fs = useFileSystem();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [viewingFile, setViewingFile] = useState<FileEntry | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SyncStatus>>('/files/sync/status');
      return res.data.data;
    },
    retry: false,
    staleTime: 60000,
  });

  const displayEntries = useMemo(
    () => (searchQuery.trim() ? filterTree(fs.entries, searchQuery.trim()) : fs.entries),
    [fs.entries, searchQuery]
  );

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
      {/* Stats Dashboard */}
      {fs.stats && !fs.scanning && (
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
              <FolderIcon className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight">{fs.stats.totalFolders}</p>
                <p className="text-[11px] text-muted-foreground">Folders</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight">{fs.stats.totalFiles}</p>
                <p className="text-[11px] text-muted-foreground">Files</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
              <Layers className="h-4 w-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight">
                  {fs.stats.totalFiles + fs.stats.totalFolders}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Items</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
              <HardDrive className="h-4 w-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight truncate">{formatBytes(fs.stats.totalSize)}</p>
                <p className="text-[11px] text-muted-foreground">Total Size</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning progress */}
      {fs.scanning && (
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{fs.scanProgress}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          <span className="truncate text-sm font-medium">{fs.rootName}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={fs.requestAccess}
            aria-label="Select a different folder"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Change Folder</span>
          </Button>
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
            disabled={fs.scanning}
            aria-label="Refresh file tree"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fs.scanning ? 'animate-spin' : ''}`} />
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
        {/* Left sidebar - folder tree */}
        <div className={cn(
          'w-full shrink-0 border-r md:w-72 flex flex-col',
          viewingFile ? 'hidden md:flex' : 'flex'
        )}>
          {/* Search bar */}
          <div className="border-b px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border bg-transparent py-1.5 pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                aria-label="Search files and folders"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Selected path */}
          {selectedEntry && (
            <div className="border-b px-3 py-1.5">
              <p className="truncate text-[11px] text-muted-foreground" title={selectedEntry.path}>
                {fs.rootName}/{selectedEntry.path}
              </p>
            </div>
          )}

          <ScrollArea className="flex-1">
            <FolderTree
              entries={displayEntries}
              selectedPath={selectedEntry?.path ?? null}
              onSelect={handleSelect}
              onToggle={fs.toggleDirectory}
            />
          </ScrollArea>
        </div>

        {/* Center - file viewer/editor */}
        <div className={cn(
          'flex-1 overflow-hidden',
          viewingFile ? 'block' : 'hidden md:block'
        )}>
          {viewingFile ? (
            <div className="flex h-full flex-col">
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
