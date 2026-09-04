import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  idleSave,
  runSave,
  SaveBar,
  type SaveState,
} from '../../components/admin-form';
import type { ProjectItem } from '../../lib/content';
import { saveWorkFn } from '../../server/admin';
import { getContentFn } from '../../server/content';

export const Route = createFileRoute('/admin/work')({
  loader: () => getContentFn(),
  component: WorkPage,
});

type EditableProject = Omit<ProjectItem, 'id' | 'sortOrder'>;
type Kind = 'spotlight' | 'engineering' | 'archive';

const BLANK: EditableProject = {
  kind: 'spotlight',
  category: '',
  name: '',
  href: '',
  description: '',
  ownership: '',
  role: '',
  status: '',
  linkLabel: '',
  technologies: [],
};

function SectionFields(props: {
  title: string;
  value: { eyebrow: string; title: string; copy: string };
  onInput: (field: 'eyebrow' | 'title' | 'copy', value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="gap-4 grid">
          <div className="gap-4 grid sm:grid-cols-2">
            <Field label="Eyebrow">
              <Input
                value={props.value.eyebrow}
                onChange={(e) => props.onInput('eyebrow', e.target.value)}
              />
            </Field>
            <Field label="Title">
              <Input
                value={props.value.title}
                onChange={(e) => props.onInput('title', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Copy">
            <Textarea
              rows={2}
              value={props.value.copy}
              onChange={(e) => props.onInput('copy', e.target.value)}
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard(props: {
  project: EditableProject;
  index: number;
  onInput: (
    index: number,
    field: keyof EditableProject,
    value: string | string[],
  ) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const p = props.project;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center gap-2 mb-4">
          <Input
            className="shadow-none px-0 border-0 focus-visible:ring-0 font-semibold text-[16px]"
            placeholder="Project name"
            aria-label="Project name"
            value={p.name}
            onChange={(e) => props.onInput(props.index, 'name', e.target.value)}
          />
          <div className="flex shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Move up"
              onClick={() => props.onMove(props.index, -1)}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Move down"
              onClick={() => props.onMove(props.index, 1)}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Remove"
              onClick={() => props.onRemove(props.index)}
            >
              ✕
            </Button>
          </div>
        </div>
        <div className="gap-3 grid">
          <div className="gap-3 grid sm:grid-cols-3">
            <Field label="Kind">
              <Select
                value={p.kind}
                onValueChange={(v) =>
                  props.onInput(props.index, 'kind', v ?? 'spotlight')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotlight">spotlight</SelectItem>
                  <SelectItem value="engineering">engineering</SelectItem>
                  <SelectItem value="archive">archive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Input
                value={p.category ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'category', e.target.value)
                }
              />
            </Field>
            <Field label="URL">
              <Input
                placeholder="https://…"
                value={p.href ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'href', e.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              rows={2}
              value={p.description ?? ''}
              onChange={(e) =>
                props.onInput(props.index, 'description', e.target.value)
              }
            />
          </Field>
          <div className="gap-3 grid sm:grid-cols-2">
            <Field label="Ownership (spotlight)">
              <Textarea
                rows={2}
                value={p.ownership ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'ownership', e.target.value)
                }
              />
            </Field>
            <Field label="Role line (spotlight)">
              <Input
                value={p.role ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'role', e.target.value)
                }
              />
            </Field>
          </div>
          <div className="gap-3 grid sm:grid-cols-2">
            <Field label="Status (engineering)">
              <Input
                value={p.status ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'status', e.target.value)
                }
              />
            </Field>
            <Field label="Link label">
              <Input
                value={p.linkLabel ?? ''}
                onChange={(e) =>
                  props.onInput(props.index, 'linkLabel', e.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Technologies (comma separated)">
            <Input
              value={p.technologies.join(', ')}
              onChange={(e) =>
                props.onInput(
                  props.index,
                  'technologies',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkPage() {
  const data = Route.useLoaderData();
  const sec = (key: string) => ({
    eyebrow: data.sections[key]?.eyebrow ?? '',
    title: data.sections[key]?.title ?? '',
    copy: data.sections[key]?.copy ?? '',
  });
  const [spotlight, setSpotlight] = useState(sec('workSpotlight'));
  const [engineering, setEngineering] = useState(sec('workEngineering'));
  const [archive, setArchive] = useState(sec('workArchive'));
  const [projects, setProjects] = useState<EditableProject[]>(
    data.projects.map(({ id: _id, sortOrder: _o, ...rest }) => ({
      ...rest,
    })),
  );
  const [tab, setTab] = useState<Kind>('spotlight');
  const [state, setState] = useState<SaveState>(idleSave);

  const save = () =>
    runSave(setState, () => {
      const nul = (v: string) => (v ? v : null);
      return saveWorkFn({
        data: {
          sections: {
            workSpotlight: {
              eyebrow: nul(spotlight.eyebrow),
              title: spotlight.title,
              copy: nul(spotlight.copy),
            },
            workEngineering: {
              eyebrow: nul(engineering.eyebrow),
              title: engineering.title,
              copy: nul(engineering.copy),
            },
            workArchive: {
              eyebrow: nul(archive.eyebrow),
              title: archive.title,
              copy: nul(archive.copy),
            },
          },
          projects: projects.map((p) => ({
            kind: p.kind,
            category: nul(p.category ?? ''),
            name: p.name,
            href: nul(p.href ?? ''),
            description: nul(p.description ?? ''),
            ownership: nul(p.ownership ?? ''),
            role: nul(p.role ?? ''),
            status: nul(p.status ?? ''),
            linkLabel: nul(p.linkLabel ?? ''),
            technologies: [...p.technologies],
          })),
        },
      });
    });

  const onInput = (
    index: number,
    field: keyof EditableProject,
    value: string | string[],
  ) => {
    setProjects((list) =>
      list.map((p, j) => (j === index ? { ...p, [field]: value } : p)),
    );
  };
  // Reorder within the same kind tab.
  const moveInTab = (index: number, dir: -1 | 1) => {
    setProjects((list) => {
      const kind = list[index]?.kind;
      if (!kind) return list;
      const order = list
        .map((p, i) => (p.kind === kind ? i : -1))
        .filter((i) => i >= 0);
      const pos = order.indexOf(index);
      const other = order[pos + dir];
      if (pos < 0 || other === undefined) return list;
      const next = list.map((p) => ({
        ...p,
        technologies: [...p.technologies],
      }));
      const a = next[index];
      const b = next[other];
      if (!a || !b) return list;
      next[index] = b;
      next[other] = a;
      return next;
    });
  };
  const visible = projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.kind === tab);

  const counts = (k: Kind) => projects.filter((p) => p.kind === k).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-[22px] tracking-[-0.03em]">Work</h1>
        <p className="text-muted-foreground text-xs leading-relaxed">
          All project types live in one list; the kind tab decides where each
          appears.
        </p>
      </div>

      <SectionFields
        title="Spotlight header"
        value={spotlight}
        onInput={(f, v) => setSpotlight((s) => ({ ...s, [f]: v }))}
      />
      <SectionFields
        title="Engineering header"
        value={engineering}
        onInput={(f, v) => setEngineering((s) => ({ ...s, [f]: v }))}
      />
      <SectionFields
        title="Archive header"
        value={archive}
        onInput={(f, v) => setArchive((s) => ({ ...s, [f]: v }))}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
        <TabsList variant="line" aria-label="Project kind">
          {(['spotlight', 'engineering', 'archive'] as const).map((k) => (
            <TabsTrigger key={k} value={k}>
              {k.charAt(0).toUpperCase() + k.slice(1)}{' '}
              <Badge variant="secondary">{counts(k)}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        {visible.map(({ p, i }) => (
          <ProjectCard
            key={`${p.kind}-${p.name}-${i}`}
            project={p}
            index={i}
            onInput={onInput}
            onRemove={(idx) =>
              setProjects((list) => list.filter((_, j) => j !== idx))
            }
            onMove={moveInTab}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground text-xs">
            No {tab} projects yet.
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          setProjects((list) => [
            ...list,
            { ...BLANK, kind: tab, technologies: [] },
          ])
        }
      >
        + Add {tab} project
      </Button>

      <SaveBar state={state} onSave={save} />
    </div>
  );
}
