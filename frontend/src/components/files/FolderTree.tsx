import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileEntry } from '@/hooks/useFileSystem';

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
            <span className="w-3.5" />
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {isDir && isExpanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <TreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
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
        This folder is empty.
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
