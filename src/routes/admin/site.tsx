import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type EditableLink,
  Field,
  idleSave,
  LinkList,
  move,
  runSave,
  SaveBar,
  type SaveState,
} from '../../components/admin-form';
import { exportJsonFn, importJsonFn, saveSiteFn } from '../../server/admin';
import { getContentFn } from '../../server/content';

export const Route = createFileRoute('/admin/site')({
  loader: () => getContentFn(),
  component: SitePage,
});

function SitePage() {
  const data = Route.useLoaderData();
  const [site, setSite] = useState({ ...data.site });
  const [nav, setNav] = useState<EditableLink[]>(
    data.navLinks.map((l) => ({ ...l })),
  );
  const [quick, setQuick] = useState<EditableLink[]>(
    data.quickLinks.map((l) => ({ ...l })),
  );
  const [socials, setSocials] = useState<EditableLink[]>(
    data.socials.map((l) => ({ ...l })),
  );
  const [footer, setFooter] = useState<EditableLink[]>(
    data.footerLinks.map((l) => ({ ...l })),
  );
  const [state, setState] = useState<SaveState>(idleSave);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const patchSite = (field: keyof typeof site, value: string) =>
    setSite((s) => ({ ...s, [field]: value }));

  const save = () =>
    runSave(setState, () =>
      saveSiteFn({
        data: {
          site: { ...site },
          navLinks: nav.map((l) => ({ label: l.label, href: l.href })),
          quickLinks: quick.map((l) => ({ label: l.label, href: l.href })),
          socials: socials.map((l) => ({
            label: l.label,
            href: l.href,
            icon: l.icon ?? 'github',
          })),
          footerLinks: footer.map((l) => ({ label: l.label, href: l.href })),
        },
      }),
    );

  const doImportCheck = async () => {
    setImportMsg('');
    // Dry-run first so malformed JSON never touches the DB.
    try {
      await importJsonFn({ data: { json: importText, dryRun: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      setImportMsg(msg);
      toast.error(msg);
      return;
    }
    setConfirmOpen(true);
  };

  const doImportConfirm = async () => {
    setImporting(true);
    try {
      const res = await importJsonFn({ data: { json: importText } });
      const rows = Object.values(res.counts).reduce((a, b) => a + b, 0);
      const msg = `Imported (${rows} rows). Backup: ${res.backup || 'none (first import)'}. Reloading…`;
      setImportMsg(msg);
      toast.success(msg);
      setConfirmOpen(false);
      location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      setImportMsg(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const doExport = async () => {
    try {
      const json = await exportJsonFn();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'portfolio.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Exported portfolio.json.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const listProps = (
    rows: EditableLink[],
    set: (v: EditableLink[]) => void,
  ) => ({
    rows,
    onChange: (i: number, field: 'label' | 'href' | 'icon', value: string) => {
      set(rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
    },
    onAdd: () => set([...rows, { label: '', href: '' }]),
    onRemove: (i: number) => set(rows.filter((_, j) => j !== i)),
    onMove: (i: number, dir: -1 | 1) => set(move(rows, i, dir)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
          Site & SEO
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Identity, meta tags, links. Saving revalidates the public page.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site URL">
              <Input
                value={site.siteUrl}
                onChange={(e) => patchSite('siteUrl', e.target.value)}
              />
            </Field>
            <Field label="Open Graph image">
              <Input
                value={site.ogImage}
                onChange={(e) => patchSite('ogImage', e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Title">
              <Input
                value={site.title}
                onChange={(e) => patchSite('title', e.target.value)}
              />
            </Field>
            <Field label="Meta description">
              <Textarea
                rows={2}
                value={site.description}
                onChange={(e) => patchSite('description', e.target.value)}
              />
            </Field>
            <Field label="Social (OG/Twitter) description">
              <Textarea
                rows={2}
                value={site.socialDescription}
                onChange={(e) => patchSite('socialDescription', e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Author">
                <Input
                  value={site.author}
                  onChange={(e) => patchSite('author', e.target.value)}
                />
              </Field>
              <Field label="Twitter creator">
                <Input
                  value={site.twitterCreator}
                  onChange={(e) => patchSite('twitterCreator', e.target.value)}
                />
              </Field>
              <Field label="Theme color">
                <Input
                  value={site.themeColor}
                  onChange={(e) => patchSite('themeColor', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <LinkList title="Nav links" {...listProps(nav, setNav)} />
      <LinkList title="Quick links (hero)" {...listProps(quick, setQuick)} />
      <LinkList
        title="Socials (footer icons)"
        icons
        {...listProps(socials, setSocials)}
      />
      <LinkList
        title="Footer resource links"
        {...listProps(footer, setFooter)}
      />

      <Card>
        <CardHeader>
          <CardTitle>JSON import / export</CardTitle>
          <CardDescription>
            Same format as the CLI (`pnpm cms:import|export`). Import replaces
            all content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={doExport}>
              Download JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!importText}
              onClick={doImportCheck}
            >
              Import pasted JSON
            </Button>
          </div>
          <Textarea
            className="mt-3 font-mono"
            rows={6}
            placeholder='Paste portfolio.json here, then "Import pasted JSON"'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          {importMsg && (
            <p className="mt-2 text-[13px] text-muted-foreground">
              {importMsg}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace all content?</DialogTitle>
            <DialogDescription>
              Import replaces ALL content. A server backup is saved first.
              Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={doImportConfirm}
              disabled={importing}
            >
              {importing ? 'Importing…' : 'Replace all content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveBar state={state} onSave={save} />
    </div>
  );
}
