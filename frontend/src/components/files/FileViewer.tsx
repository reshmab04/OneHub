import { useState, useEffect } from 'react';
import { Save, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FileEntry } from '@/hooks/useFileSystem';

const textExtensions = new Set([
  '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html',
  '.xml', '.yaml', '.yml', '.toml', '.env', '.sh', '.py', '.rb', '.go',
  '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.csv', '.sql', '.log',
  '.gitignore', '.editorconfig', '.prettierrc', '.eslintrc',
]);

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

export default function FileViewer({
  entry,
  onRead,
  onWrite,
  onClose,
}: {
  entry: FileEntry;
  onRead: (entry: FileEntry) => Promise<string>;
  onWrite: (entry: FileEntry, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const ext = getExtension(entry.name);
  const isText = textExtensions.has(ext) || ext === '';
  const isImage = imageExtensions.has(ext);
  const isDirty = content !== originalContent;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (isImage) {
      const fileHandle = entry.handle as FileSystemFileHandle;
      fileHandle.getFile().then((file) => {
        if (!cancelled) {
          setImageUrl(URL.createObjectURL(file));
          setLoading(false);
        }
      });
    } else if (isText) {
      onRead(entry).then((text) => {
        if (!cancelled) {
          setContent(text);
          setOriginalContent(text);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [entry.path]);

  async function handleSave() {
    setSaving(true);
    try {
      await onWrite(entry, content);
      setOriginalContent(content);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {isImage ? (
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-medium">{entry.name}</span>
          {isDirty && (
            <Badge variant="secondary" className="text-[10px]">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isText && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!isDirty || saving}
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}

        {!loading && isText && (
          <textarea
            className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            aria-label={`Editing ${entry.name}`}
          />
        )}

        {!loading && isImage && imageUrl && (
          <div className="flex h-full items-center justify-center p-4">
            <img
              src={imageUrl}
              alt={entry.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {!loading && !isText && !isImage && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Cannot preview this file type ({ext || 'unknown'})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
