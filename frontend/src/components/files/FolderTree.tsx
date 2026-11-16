import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FileText, FileCode, FileImage, FileSpreadsheet,
  FileArchive, File, FileVideo, FileAudio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileEntry } from '@/hooks/useFileSystem';

const codeExts = new Set([
  '.js', '.ts', '.tsx', '.jsx', '.py', '.rb', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.sh', '.bash',
  '.css', '.scss', '.less', '.html', '.xml', '.json', '.yaml', '.yml',
  '.toml', '.sql', '.graphql', '.vue', '.svelte',
]);
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff']);
const videoExts = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']);
const audioExts = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']);
const spreadsheetExts = new Set(['.xlsx', '.xls', '.csv', '.ods']);
const archiveExts = new Set(['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2']);
const docExts = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md', '.rtf']);

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function FileIcon({ name }: { name: string }) {
  const ext = getExtension(name);
  const cls = 'h-4 w-4 shrink-0';

  if (codeExts.has(ext)) return <FileCode className={cn(cls, 'text-blue-400')} />;
  if (imageExts.has(ext)) return <FileImage className={cn(cls, 'text-pink-400')} />;
  if (videoExts.has(ext)) return <FileVideo className={cn(cls, 'text-red-400')} />;
  if (audioExts.has(ext)) return <FileAudio className={cn(cls, 'text-orange-400')} />;
  if (spreadsheetExts.has(ext)) return <FileSpreadsheet className={cn(cls, 'text-green-400')} />;
  if (archiveExts.has(ext)) return <FileArchive className={cn(cls, 'text-yellow-500')} />;
  if (docExts.has(ext)) return <FileText className={cn(cls, 'text-sky-400')} />;
  return <File className={cn(cls, 'text-muted-foreground')} />;
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  if (bytes < k * k * k) return `${(bytes / (k * k)).toFixed(1)} MB`;
  return `${(bytes / (k * k * k)).toFixed(1)} GB`;
}

function TreeItem({
  entry,
  depth,
  selectedPath,
  onSelect,
  onToggle,
}: {
  entry: FileEntry;
  depth: number;
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
  onToggle: (entry: FileEntry) => void;
}) {
  const isDir = entry.kind === 'directory';
  const isSelected = entry.path === selectedPath;
  const isExpanded = entry.expanded;
  const ext = getExtension(entry.name);

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent/50',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isDir) onToggle(entry);
          onSelect(entry);
        }}
      >
        {isDir ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-amber-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <FileIcon name={entry.name} />
          </>
        )}
        <span className="truncate">{entry.name}</span>

        {/* Metadata */}
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {isDir && (entry.fileCount !== undefined || entry.folderCount !== undefined) && (
            <span className="text-[10px] text-muted-foreground">
              {(entry.folderCount ?? 0) > 0 && `${entry.folderCount}F `}
              {entry.fileCount ?? 0}f
            </span>
          )}
          {!isDir && entry.size !== undefined && entry.size > 0 && (
            <span className="text-[10px] text-muted-foreground">{formatSize(entry.size)}</span>
          )}
          {!isDir && ext && (
            <span className="rounded bg-muted px-1 py-0.5 text-[9px] uppercase text-muted-foreground">
              {ext.slice(1)}
            </span>
          )}
        </span>
      </button>
      {isDir && isExpanded && entry.children && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          {entry.children.length === 0 ? (
            <p
              className="py-1 text-[11px] italic text-muted-foreground"
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
            >
              Empty folder
            </p>
          ) : (
            entry.children.map((child) => (
              <TreeItem
                key={child.path}
                entry={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  entries,
  selectedPath,
  onSelect,
  onToggle,
}: {
  entries: FileEntry[];
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
  onToggle: (entry: FileEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-xs text-muted-foreground">
        No items found.
      </p>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {entries.map((entry) => (
        <TreeItem
          key={entry.path}
          entry={entry}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
