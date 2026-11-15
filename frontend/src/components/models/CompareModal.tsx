import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScoreBar from './ScoreBar';
import type { AIModel } from '@/types';

const scoreLabels: { key: keyof AIModel['scores']; label: string }[] = [
  { key: 'writing', label: 'Writing' },
  { key: 'coding', label: 'Coding' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'textGeneration', label: 'Text Generation' },
  { key: 'imageGeneration', label: 'Image Generation' },
];

export default function CompareModal({
  open,
  onOpenChange,
  models,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: AIModel[];
  onRemove: (model: AIModel) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare Models ({models.length})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Attribute
                  </th>
                  {models.map((m) => (
                    <th key={m.id} className="min-w-[140px] px-3 py-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{m.name}</p>
                          <p className="text-xs font-normal text-muted-foreground">{m.provider}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onRemove(m)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Scores */}
                {scoreLabels.map(({ key, label }) => {
                  const hasAny = models.some((m) => m.scores[key] !== null);
                  if (!hasAny) return null;

                  const scores = models.map((m) => m.scores[key]).filter((s): s is number => s !== null);
                  const maxScore = Math.max(...scores);

                  return (
                    <tr key={key} className="border-b">
                      <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground">
                        {label}
                      </td>
                      {models.map((m) => (
                        <td key={m.id} className="px-3 py-2.5">
                          {m.scores[key] !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="relative h-2 w-16 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${
                                    m.scores[key] === maxScore
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${m.scores[key]}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  m.scores[key] === maxScore ? 'text-emerald-500' : ''
                                }`}
                              >
                                {m.scores[key]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Categories */}
                <tr className="border-b">
                  <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground">
                    Categories
                  </td>
                  {models.map((m) => (
                    <td key={m.id} className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {m.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Capabilities */}
                <tr className="border-b">
                  <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground">
                    Capabilities
                  </td>
                  {models.map((m) => (
                    <td key={m.id} className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {m.capabilities.map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Use Cases */}
                <tr>
                  <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground">
                    Use Cases
                  </td>
                  {models.map((m) => (
                    <td key={m.id} className="px-3 py-2.5">
                      <ul className="space-y-0.5 text-xs text-muted-foreground">
                        {m.useCases.map((u) => (
                          <li key={u}>• {u}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] italic text-muted-foreground/70">
            All scores are illustrative ratings and should not be treated as verified benchmarks.
          </p>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
