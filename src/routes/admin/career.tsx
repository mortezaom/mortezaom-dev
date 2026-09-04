import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  idleSave,
  move,
  runSave,
  SaveBar,
  type SaveState,
} from '../../components/admin-form';
import { saveCareerFn } from '../../server/admin';
import { getContentFn } from '../../server/content';

export const Route = createFileRoute('/admin/career')({
  loader: () => getContentFn(),
  component: CareerPage,
});

function CareerPage() {
  const data = Route.useLoaderData();
  const sec = (key: string) => ({
    eyebrow: data.sections[key]?.eyebrow ?? '',
    title: data.sections[key]?.title ?? '',
    copy: data.sections[key]?.copy ?? '',
  });
  const [expSec, setExpSec] = useState(sec('experience'));
  const [skillSec, setSkillSec] = useState(sec('skills'));
  const [exp, setExp] = useState(
    data.experience.map(({ id: _id, sortOrder: _o, ...rest }) => ({
      ...rest,
      stack: [...rest.stack],
    })),
  );
  const [groups, setGroups] = useState(
    data.skillGroups.map(({ id: _id, sortOrder: _o, ...rest }) => ({
      ...rest,
      technologies: [...rest.technologies],
    })),
  );
  const [state, setState] = useState<SaveState>(idleSave);

  const save = () =>
    runSave(setState, () => {
      const nul = (v: string) => (v ? v : null);
      return saveCareerFn({
        data: {
          sections: {
            experience: {
              eyebrow: nul(expSec.eyebrow),
              title: expSec.title,
              copy: nul(expSec.copy),
            },
            skills: {
              eyebrow: nul(skillSec.eyebrow),
              title: skillSec.title,
              copy: nul(skillSec.copy),
            },
          },
          experience: exp.map((e) => ({ ...e, stack: [...e.stack] })),
          skillGroups: groups.map((g) => ({
            ...g,
            technologies: [...g.technologies],
          })),
        },
      });
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-[22px] tracking-[-0.03em]">Career</h1>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Experience timeline + skill groups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Experience header</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-4 grid">
            <Field label="Title">
              <Input
                value={expSec.title}
                onChange={(e) =>
                  setExpSec((s) => ({ ...s, title: e.target.value }))
                }
              />
            </Field>
            <Field label="Copy">
              <Textarea
                rows={2}
                value={expSec.copy}
                onChange={(e) =>
                  setExpSec((s) => ({ ...s, copy: e.target.value }))
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {exp.map((e, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center gap-2 mb-4">
                <Input
                  className="shadow-none px-0 border-0 focus-visible:ring-0 font-semibold text-[16px]"
                  placeholder="Role"
                  aria-label="Role"
                  value={e.role}
                  onChange={(ev) =>
                    setExp((list) =>
                      list.map((x, j) =>
                        j === i ? { ...x, role: ev.target.value } : x,
                      ),
                    )
                  }
                />
                <div className="flex shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Move up"
                    onClick={() =>
                      setExp((list) =>
                        move(
                          list.map((x) => ({ ...x, stack: [...x.stack] })),
                          i,
                          -1,
                        ),
                      )
                    }
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Move down"
                    onClick={() =>
                      setExp((list) =>
                        move(
                          list.map((x) => ({ ...x, stack: [...x.stack] })),
                          i,
                          1,
                        ),
                      )
                    }
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Remove"
                    onClick={() =>
                      setExp((list) => list.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="gap-3 grid">
                <div className="gap-3 grid sm:grid-cols-3">
                  <Field label="Company">
                    <Input
                      value={e.company}
                      onChange={(ev) =>
                        setExp((list) =>
                          list.map((x, j) =>
                            j === i ? { ...x, company: ev.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Period label">
                    <Input
                      value={e.period}
                      onChange={(ev) =>
                        setExp((list) =>
                          list.map((x, j) =>
                            j === i ? { ...x, period: ev.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Start (YYYY-MM, for sorting)">
                    <Input
                      value={e.startDate}
                      onChange={(ev) =>
                        setExp((list) =>
                          list.map((x, j) =>
                            j === i ? { ...x, startDate: ev.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={e.description}
                    onChange={(ev) =>
                      setExp((list) =>
                        list.map((x, j) =>
                          j === i ? { ...x, description: ev.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Stack (comma separated)">
                  <Input
                    value={e.stack.join(', ')}
                    onChange={(ev) =>
                      setExp((list) =>
                        list.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                stack: ev.target.value
                                  .split(',')
                                  .map((t) => t.trim())
                                  .filter(Boolean),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          setExp((list) => [
            ...list,
            {
              role: '',
              company: '',
              period: '',
              startDate: '',
              description: '',
              stack: [],
            },
          ])
        }
      >
        + Add experience
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Skills header</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Title (supports line breaks as written)">
            <Textarea
              rows={2}
              value={skillSec.title}
              onChange={(e) =>
                setSkillSec((s) => ({ ...s, title: e.target.value }))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="gap-4 grid sm:grid-cols-2">
        {groups.map((g, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center gap-2 mb-3">
                <Input
                  className="shadow-none px-0 border-0 focus-visible:ring-0 font-semibold text-[14px]"
                  placeholder="Group name"
                  aria-label="Group name"
                  value={g.name}
                  onChange={(ev) =>
                    setGroups((list) =>
                      list.map((x, j) =>
                        j === i ? { ...x, name: ev.target.value } : x,
                      ),
                    )
                  }
                />
                <div className="flex shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Move up"
                    onClick={() =>
                      setGroups((list) =>
                        move(
                          list.map((x) => ({
                            ...x,
                            technologies: [...x.technologies],
                          })),
                          i,
                          -1,
                        ),
                      )
                    }
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Move down"
                    onClick={() =>
                      setGroups((list) =>
                        move(
                          list.map((x) => ({
                            ...x,
                            technologies: [...x.technologies],
                          })),
                          i,
                          1,
                        ),
                      )
                    }
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Remove"
                    onClick={() =>
                      setGroups((list) => list.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <Field label="Technologies (comma separated)">
                <Textarea
                  rows={3}
                  value={g.technologies.join(', ')}
                  onChange={(ev) =>
                    setGroups((list) =>
                      list.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              technologies: ev.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                          : x,
                      ),
                    )
                  }
                />
              </Field>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          setGroups((list) => [...list, { name: '', technologies: [] }])
        }
      >
        + Add skill group
      </Button>

      <SaveBar state={state} onSave={save} />
    </div>
  );
}
