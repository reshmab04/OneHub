import { useState, useCallback } from 'react';

export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: FileEntry[];
  expanded?: boolean;
}

async function readDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    entries.push({
      name,
      kind: handle.kind,
      path: parentPath ? `${parentPath}/${name}` : name,
      handle,
      children: handle.kind === 'directory' ? undefined : undefined,
    });
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
  const [error, setError] = useState<string | null>(null);

  const requestAccess = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setRootHandle(handle);
      setRootName(handle.name);
      const items = await readDirectory(handle, '');
      setEntries(items);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to access folder');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const expandDirectory = useCallback(
    async (entry: FileEntry) => {
      if (entry.kind !== 'directory') return;
      const dirHandle = entry.handle as FileSystemDirectoryHandle;
      const children = await readDirectory(dirHandle, entry.path);

      setEntries((prev) => {
        function updateTree(items: FileEntry[]): FileEntry[] {
          return items.map((item) => {
            if (item.path === entry.path) {
              return { ...item, children, expanded: !item.expanded };
            }
            if (item.children) {
              return { ...item, children: updateTree(item.children) };
            }
            return item;
          });
        }
        return updateTree(prev);
      });
    },
    []
  );

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

      const items = await readDirectory(rootHandle, '');
      setEntries(items);
    },
    [rootHandle]
  );

  const getFileBlob = useCallback(async (entry: FileEntry): Promise<File> => {
    const fileHandle = entry.handle as FileSystemFileHandle;
    return fileHandle.getFile();
  }, []);

  const refresh = useCallback(async () => {
    if (!rootHandle) return;
    setLoading(true);
    try {
      const items = await readDirectory(rootHandle, '');
      setEntries(items);
    } finally {
      setLoading(false);
    }
  }, [rootHandle]);

  return {
    isSupported: 'showDirectoryPicker' in window,
    hasAccess: !!rootHandle,
    rootName,
    entries,
    loading,
    error,
    requestAccess,
    expandDirectory,
    readFile,
    writeFile,
    createFile,
    getFileBlob,
    refresh,
  };
}
