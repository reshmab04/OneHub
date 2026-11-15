import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const languages = [
  'All Languages',
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'Java',
  'C++',
  'C#',
  'Ruby',
  'Swift',
  'Kotlin',
  'PHP',
  'Shell',
  'Dart',
  'Scala',
  'Zig',
  'Elixir',
  'Lua',
  'HTML',
  'CSS',
  'Vue',
  'Svelte',
];

export default function LanguageFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (lang: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = value || 'All Languages';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
        aria-label="Filter by language"
      >
        <ChevronsUpDown className="h-3.5 w-3.5" />
        {display}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {languages.map((lang) => {
          const langValue = lang === 'All Languages' ? '' : lang;
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => {
                onChange(langValue);
                setOpen(false);
              }}
              className={cn('gap-2', value === langValue && 'font-medium')}
            >
              <Check
                className={cn(
                  'h-3.5 w-3.5',
                  value === langValue ? 'opacity-100' : 'opacity-0'
                )}
              />
              {lang}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
