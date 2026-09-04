import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  deleteContactMessageFn,
  listContactMessagesFn,
} from '../../server/contact';

export const Route = createFileRoute('/admin/messages')({
  loader: () => listContactMessagesFn(),
  component: MessagesPage,
});

function MessagesPage() {
  const data = Route.useLoaderData();
  const [messages, setMessages] = useState(data.messages);
  const [showSpam, setShowSpam] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const visible = messages.filter((m) => (showSpam ? true : !m.isSpam));
  const spamCount = messages.filter((m) => m.isSpam).length;

  const remove = async (id: number) => {
    setDeleting(id);
    try {
      await deleteContactMessageFn({ data: { id } });
      setMessages((list) => list.filter((m) => m.id !== id));
      toast.success('Message deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-[22px] tracking-[-0.03em]">
            Messages
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Contact form submissions. {messages.length} total
            {spamCount > 0 && ` · ${spamCount} flagged as spam`}.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSpam((v) => !v)}
        >
          {showSpam ? 'Hide spam' : `Show spam (${spamCount})`}
        </Button>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-[13px]">
              No messages yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[14px]">{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-muted-foreground text-[13px] hover:text-foreground hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.isSpam === 1 && (
                    <Badge variant="destructive">
                      spam{m.spamReason ? `: ${m.spamReason}` : ''}
                    </Badge>
                  )}
                  <span className="text-muted-foreground ml-auto text-[12px]">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-[1.7] whitespace-pre-wrap">
                  {m.message}
                </p>
                <p className="text-muted-foreground mt-3 font-mono text-[11px]">
                  ip: {m.ip ?? '-'} · origin: {m.origin ?? '-'}
                  {m.userAgent ? ` · ${m.userAgent.slice(0, 120)}` : ''}
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deleting === m.id}
                    onClick={() => remove(m.id)}
                  >
                    {deleting === m.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
