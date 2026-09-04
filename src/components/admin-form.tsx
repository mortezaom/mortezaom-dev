import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface EditableLink {
  label: string;
  href: string;
  icon?: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveState {
  status: SaveStatus;
  message: string;
}

export const idleSave: SaveState = { status: 'idle', message: '' };

export function Field(props: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <Label className="mb-1.5">{props.label}</Label>
      {props.children}
      {props.hint && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {props.hint}
        </p>
      )}
    </div>
  );
}

export function SaveBar(props: { state: SaveState; onSave: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-6 border-t bg-background/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          disabled={props.state.status === 'saving'}
          onClick={props.onSave}
        >
          {props.state.status === 'saving' ? 'Saving…' : 'Save'}
        </Button>
        {props.state.status === 'saved' && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved.
          </span>
        )}
        {props.state.status === 'error' && (
          <span role="alert" className="text-sm text-destructive">
            {props.state.message}
          </span>
        )}
      </div>
    </div>
  );
}

export async function runSave(
  setState: (s: SaveState) => void,
  fn: () => Promise<unknown>,
  successMessage = 'Saved.',
) {
  setState({ status: 'saving', message: '' });
  try {
    await fn();
    setState({ status: 'saved', message: '' });
    toast.success(successMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed.';
    setState({ status: 'error', message });
    toast.error(message);
  }
}

export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return next;
  const a = next[index];
  const b = next[j];
  if (a === undefined || b === undefined) return next;
  next[index] = b;
  next[j] = a;
  return next;
}

const ICON_OPTIONS = ['github', 'linkedin', 'x', 'mail'] as const;

export function LinkList(props: {
  title: string;
  rows: EditableLink[];
  icons?: boolean;
  onChange: (
    index: number,
    field: 'label' | 'href' | 'icon',
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {props.rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Label"
                aria-label="Label"
                value={row.label}
                onChange={(e) => props.onChange(i, 'label', e.target.value)}
              />
              <Input
                className="flex-[2]"
                placeholder="https://… or #anchor or mailto:…"
                aria-label="URL"
                value={row.href}
                onChange={(e) => props.onChange(i, 'href', e.target.value)}
              />
              {props.icons && (
                <Select
                  value={row.icon ?? 'github'}
                  onValueChange={(v) =>
                    props.onChange(i, 'icon', v ?? 'github')
                  }
                >
                  <SelectTrigger aria-label="Icon" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Move up"
                onClick={() => props.onMove(i, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Move down"
                onClick={() => props.onMove(i, 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Remove"
                onClick={() => props.onRemove(i)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={props.onAdd}
        >
          + Add
        </Button>
      </CardContent>
    </Card>
  );
}
