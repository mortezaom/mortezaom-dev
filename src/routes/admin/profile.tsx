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
import { saveProfileFn } from '../../server/admin';
import { getContentFn } from '../../server/content';

export const Route = createFileRoute('/admin/profile')({
  loader: () => getContentFn(),
  component: ProfilePage,
});

function ProfilePage() {
  const data = Route.useLoaderData();
  const [profile, setProfile] = useState({ ...data.profile });
  const [about, setAbout] = useState({
    eyebrow: data.sections.about?.eyebrow ?? '',
    title: data.sections.about?.title ?? '',
    copy: data.sections.about?.copy ?? '',
  });
  const [paragraphs, setParagraphs] = useState<string[]>([
    ...data.profile.aboutParagraphs,
  ]);
  const [heroName, setHeroName] = useState<string[]>([
    ...data.profile.heroName,
  ]);
  const [stats, setStats] = useState(data.stats.map((s) => ({ ...s })));
  const [state, setState] = useState<SaveState>(idleSave);

  const patchProfile = (field: keyof typeof profile, value: string) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const save = () =>
    runSave(setState, () =>
      saveProfileFn({
        data: {
          profile: {
            ...profile,
            heroName: [...heroName],
            aboutParagraphs: [...paragraphs],
          },
          about: {
            eyebrow: about.eyebrow || null,
            title: about.title,
            copy: about.copy || null,
          },
          stats: stats.map((s) => ({ value: s.value, label: s.label })),
        },
      }),
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
          Profile
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Hero, about, contact, stats.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Field label="Name lines (one per line)" hint="Big display name.">
              <Textarea
                rows={3}
                value={heroName.join('\n')}
                onChange={(e) => setHeroName(e.target.value.split('\n'))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role">
                <Input
                  value={profile.heroRole}
                  onChange={(e) => patchProfile('heroRole', e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={profile.email}
                  onChange={(e) => patchProfile('email', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Tagline">
              <Input
                value={profile.heroTagline}
                onChange={(e) => patchProfile('heroTagline', e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hero card title">
                <Input
                  value={profile.heroCardTitle}
                  onChange={(e) =>
                    patchProfile('heroCardTitle', e.target.value)
                  }
                />
              </Field>
              <Field label="Hero card copy">
                <Input
                  value={profile.heroCardCopy}
                  onChange={(e) => patchProfile('heroCardCopy', e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="CV path"
              hint="File in public/, e.g. /Morteza-Omar-Mohammadi-CV.pdf"
            >
              <Input
                value={profile.cvPath}
                onChange={(e) => patchProfile('cvPath', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Field label="Section title">
              <Input
                value={about.title}
                onChange={(e) =>
                  setAbout((a) => ({ ...a, title: e.target.value }))
                }
              />
            </Field>
            {paragraphs.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <Textarea
                  className="flex-1"
                  rows={3}
                  value={p}
                  onChange={(e) =>
                    setParagraphs((list) =>
                      list.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Remove"
                  onClick={() =>
                    setParagraphs((list) => list.filter((_, j) => j !== i))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setParagraphs((list) => [...list, ''])}
            >
              + Add paragraph
            </Button>
            <Field label="Portrait alt text">
              <Input
                value={profile.portraitAlt}
                onChange={(e) => patchProfile('portraitAlt', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats (hero card)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Value"
                  aria-label="Value"
                  value={s.value}
                  onChange={(e) =>
                    setStats((list) =>
                      list.map((x, j) =>
                        j === i ? { ...x, value: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  className="flex-[2]"
                  placeholder="Label"
                  aria-label="Label"
                  value={s.label}
                  onChange={(e) =>
                    setStats((list) =>
                      list.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Move up"
                  onClick={() =>
                    setStats((list) =>
                      move(
                        list.map((x) => ({ ...x })),
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
                    setStats((list) =>
                      move(
                        list.map((x) => ({ ...x })),
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
                    setStats((list) => list.filter((_, j) => j !== i))
                  }
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
            onClick={() =>
              setStats((list) => [
                ...list,
                { id: 0, value: '', label: '', sortOrder: 0 },
              ])
            }
          >
            + Add stat
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact (footer)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Field label="Heading">
              <Input
                value={profile.contactHeading}
                onChange={(e) => patchProfile('contactHeading', e.target.value)}
              />
            </Field>
            <Field label="Copy">
              <Textarea
                rows={2}
                value={profile.contactCopy}
                onChange={(e) => patchProfile('contactCopy', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <SaveBar state={state} onSave={save} />
    </div>
  );
}
