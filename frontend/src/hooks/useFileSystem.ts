import { useState, useCallback, useRef } from 'react';

export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: FileEntry[];
  expanded?: boolean;
  size?: number;
  fileCount?: number;
  folderCount?: number;
}

export interface ScanStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  scanTime: number;
}

async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string,
  stats: { files: number; folders: number; size: number },
  signal?: AbortSignal
): Promise<FileEntry[]> {
  if (signal?.aborted) return [];

  const entries: FileEntry[] = [];

  try {
    for await (const [name, handle] of dirHandle.entries()) {
      if (signal?.aborted) break;

      if (handle.kind === 'directory') {
        stats.folders++;
        const childPath = parentPath ? `${parentPath}/${name}` : name;
        const children = await scanDirectory(
          handle as FileSystemDirectoryHandle,
          childPath,
          stats,
          signal
        );
        const fileCount = children.reduce(
          (sum, c) => sum + (c.kind === 'file' ? 1 : (c.fileCount ?? 0)),
          0
        );
        const folderCount = children.reduce(
          (sum, c) => sum + (c.kind === 'directory' ? 1 : 0) + (c.folderCount ?? 0),
          0
        );
        entries.push({
          name,
          kind: 'directory',
          path: childPath,
          handle,
          children,
          expanded: false,
          fileCount,
          folderCount,
        });
      } else {
        stats.files++;
        const childPath = parentPath ? `${parentPath}/${name}` : name;
        let size = 0;
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          size = file.size;
          stats.size += size;
        } catch {}
        entries.push({
          name,
          kind: 'file',
          path: childPath,
          handle,
          size,
        });
      }
    }
  } catch {
    // Permission denied or inaccessible directory
  }

  return entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function useFileSystem() {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rootName, setRootName] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doScan = useCallback(async (handle: FileSystemDirectoryHandle) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setScanning(true);
    setScanProgress('Scanning folders...');
    const startTime = Date.now();
    const counters = { files: 0, folders: 0, size: 0 };

    const progressInterval = setInterval(() => {
      setScanProgress(
        `Scanning... ${counters.folders} folders, ${counters.files} files found`
      );
    }, 200);

    try {
      const items = await scanDirectory(handle, '', counters, controller.signal);
      clearInterval(progressInterval);
      if (!controller.signal.aborted) {
        setEntries(items);
        setStats({
          totalFiles: counters.files,
          totalFolders: counters.folders,
          totalSize: counters.size,
          scanTime: Date.now() - startTime,
        });
      }
    } catch {
      clearInterval(progressInterval);
    } finally {
      setScanning(false);
      setScanProgress('');
    }
  }, []);

  const requestAccess = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setRootHandle(handle);
      setRootName(handle.name);
      setLoading(false);
      await doScan(handle);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to access folder');
      }
      setLoading(false);
    }
  }, [doScan]);

  const toggleDirectory = useCallback((entry: FileEntry) => {
    if (entry.kind !== 'directory') return;
    setEntries((prev) => {
      function updateTree(items: FileEntry[]): FileEntry[] {
        return items.map((item) => {
          if (item.path === entry.path) {
            return { ...item, expanded: !item.expanded };
          }
          if (item.children) {
            return { ...item, children: updateTree(item.children) };
          }
          return item;
        });
      }
      return updateTree(prev);
    });
  }, []);

  const readFile = useCallback(async (entry: FileEntry): Promise<string> => {
    const fileHandle = entry.handle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    return file.text();
  }, []);

  const writeFile = useCallback(
    async (entry: FileEntry, content: string) => {
      const fileHandle = entry.handle as FileSystemFileHandle;
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    },
    []
  );

  const createFile = useCallback(
    async (parentPath: string, fileName: string, content: string = '') => {
      if (!rootHandle) return;

      let targetDir = rootHandle;
      if (parentPath) {
        const parts = parentPath.split('/');
        for (const part of parts) {
          targetDir = await targetDir.getDirectoryHandle(part);
        }
      }

      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      await doScan(rootHandle);
    },
    [rootHandle, doScan]
  );

  const getFileBlob = useCallback(async (entry: FileEntry): Promise<File> => {
    const fileHandle = entry.handle as FileSystemFileHandle;
    return fileHandle.getFile();
  }, []);

  const refresh = useCallback(async () => {
    if (!rootHandle) return;
    await doScan(rootHandle);
  }, [rootHandle, doScan]);

  return {
    isSupported: 'showDirectoryPicker' in window,
    hasAccess: !!rootHandle,
    rootName,
    entries,
    loading,
    scanning,
    scanProgress,
    error,
    stats,
    requestAccess,
    toggleDirectory,
    readFile,
    writeFile,
    createFile,
    getFileBlob,
    refresh,
  };
}
