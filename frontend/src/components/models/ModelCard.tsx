import { ExternalLink, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ScoreBar from './ScoreBar';
import type { AIModel } from '@/types';

const providerColors: Record<string, string> = {
  OpenAI: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Anthropic: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  Google: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Meta: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'Mistral AI': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  Midjourney: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Stability AI': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  DeepSeek: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

const scoreLabels: { key: keyof AIModel['scores']; label: string }[] = [
  { key: 'writing', label: 'Writing' },
  { key: 'coding', label: 'Coding' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'textGeneration', label: 'Text Gen' },
  { key: 'imageGeneration', label: 'Image Gen' },
];

export default function ModelCard({
  model,
  isSelected,
  onToggleCompare,
}: {
  model: AIModel;
  isSelected: boolean;
  onToggleCompare: (model: AIModel) => void;
}) {
  const visibleScores = scoreLabels.filter(({ key }) => model.scores[key] !== null);

  return (
    <Card className={`transition-colors ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <a
              href={model.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {model.name}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onToggleCompare(model)}
          >
            {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-xs text-muted-foreground">{model.description}</p>

        <div className="flex flex-wrap gap-1">
          {model.categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className={`text-[10px] ${providerColors[model.provider] || ''}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="space-y-1.5 pt-1">
          {visibleScores.map(({ key, label }) => (
            <ScoreBar key={key} label={label} score={model.scores[key]} compact />
          ))}
        </div>

        <p className="text-[10px] italic text-muted-foreground/70">{model.scoreSource}</p>
      </CardContent>
    </Card>
  );
}
