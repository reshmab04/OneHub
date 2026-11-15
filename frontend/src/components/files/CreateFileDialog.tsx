import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateFileDialog({
  open,
  onOpenChange,
  currentPath,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onCreate: (parentPath: string, fileName: string) => Promise<void>;
}) {
  const [fileName, setFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    const name = fileName.trim();
    if (!name) {
      setError('File name is required');
      return;
    }
    if (/[/\\:*?"<>|]/.test(name)) {
      setError('File name contains invalid characters');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await onCreate(currentPath, name);
      setFileName('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create file');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {currentPath && (
            <p className="text-xs text-muted-foreground">
              In: {currentPath}/
            </p>
          )}
          <Input
            placeholder="filename.txt"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
