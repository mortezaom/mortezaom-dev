import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUR } from '../components/icons';
import { submitContactFn } from '../server/contact';
import { getContentFn } from '../server/content';
import { initPointerEffects } from '../lib/pointer-effects';

export const Route = createFileRoute('/contact')({
  loader: () => getContentFn().catch(() => null),
  headers: () => ({
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
  }),
  head: ({ loaderData }) => {
    const c = loaderData as {
      site?: { siteUrl?: string; title?: string };
    } | null;
    const siteUrl = c?.site?.siteUrl ?? 'https://mortezaom.dev';
    const title = 'Get in touch — Morteza Omar Mohammadi';
    const desc =
      'Have a project, idea, or opportunity in mind? Send me a message and I’ll get back to you as soon as I can.';
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: `${siteUrl}/contact` },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/contact` }],
    };
  },
  component: ContactPage,
});

type Status = 'idle' | 'sending' | 'sent' | 'error';

const WRAP = 'max-w-[1240px] mx-auto px-6';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = 'name' | 'email' | 'message';

/** Mirrors server-side rules in src/server/contact.ts. */
function validateField(field: FieldName, raw: string): string | null {
  const v = raw.trim();
  if (field === 'name') {
    if (!v) return 'Please enter your name.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    if (v.length > 100) return 'Name must be under 100 characters.';
    return null;
  }
  if (field === 'email') {
    if (!v) return 'Please enter your email address.';
    if (v.length > 320 || !EMAIL_RE.test(v))
      return 'Please enter a valid email address.';
    return null;
  }
  if (!v) return 'Please tell me about your project.';
  if (v.length < 10) return 'Message must be at least 10 characters.';
  if (v.length > 5000) return 'Message must be under 5000 characters.';
  return null;
}

function ContactPage() {
  const content = Route.useLoaderData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot: real users never see/fill this.
  const [website, setWebsite] = useState('');
  const [renderedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuEl = useRef<HTMLDivElement>(null);

  useEffect(() => initPointerEffects(), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('menu-toggle')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /** Re-validate a field live once the user has tried submitting. */
  const handleFieldChange = (
    field: FieldName,
    value: string,
    set: (v: string) => void,
  ) => {
    set(value);
    if (submitted) {
      const msg = validateField(field, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (msg) next[field] = msg;
        else delete next[field];
        return next;
      });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<FieldName, string>> = {};
    for (const field of ['name', 'email', 'message'] as const) {
      const value =
        field === 'name' ? name : field === 'email' ? email : message;
      const msg = validateField(field, value);
      if (msg) next[field] = msg;
    }
    setSubmitted(true);
    setFieldErrors(next);
    const firstInvalid = (['name', 'email', 'message'] as const).find(
      (f) => next[f],
    );
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await submitContactFn({
        data: { name, email, message, website, renderedAt },
      });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Send failed.');
    }
  };

  const navLinks = content?.navLinks ?? [];
  const cvPath = content?.profile.cvPath ?? '/morteza-om-cv.pdf';
  const emailAddr = content?.profile.email ?? '';

  return (
    <>
      {/* Same site header as the homepage. */}
      <header className="top-0 z-500 sticky bg-bg/85 backdrop-blur-md border-line border-b cursor-zone site-header halo-target halo-cell">
        <div className={`${WRAP} flex items-center justify-between h-17`}>
          <Link
            to="/"
            className="flex-1 font-tight font-bold text-[20px] tracking-[-0.03em]"
          >
            mortezaom
          </Link>
          <nav aria-label="Main" className="max-nav:hidden flex gap-9">
            {navLinks.map((l) => (
              <a
                key={l.href + l.label}
                href={`/${l.href}`}
                className="after:bottom-0 after:left-0 after:absolute relative after:bg-ink py-1 after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
              >
                {l.label}
              </a>
            ))}
            <a
              href={cvPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex after:bottom-0 after:left-0 after:absolute relative items-center gap-1 after:bg-ink py-1 after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
            >
              Résumé <ArrowUR size={11} />
            </a>
          </nav>
          {/* Balance spacer: matches the brand block so the nav stays centered. */}
          <div aria-hidden="true" className="max-nav:hidden flex-1" />
          <button
            id="menu-toggle"
            type="button"
            className="hidden relative max-nav:flex flex-col justify-center items-center -mr-2.5 size-11"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={`absolute w-5.5 h-0.5 bg-ink transition-transform duration-300 ${
                menuOpen ? 'rotate-45' : '-translate-y-1.75'
              }`}
            />
            <span
              className={`absolute w-5.5 h-0.5 bg-ink transition-opacity duration-200 ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute w-5.5 h-0.5 bg-ink transition-transform duration-300 ${
                menuOpen ? '-rotate-45' : 'translate-y-1.75'
              }`}
            />
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuEl}
        inert={menuOpen ? undefined : true}
        aria-hidden={!menuOpen}
        className={`hidden max-nav:flex fixed inset-0 bg-bg z-400 flex-col pt-17 px-6 pb-8 transition-transform duration-550 ease-smooth motion-reduce:transition-none ${
          menuOpen ? 'translate-y-0' : '-translate-y-[calc(100%+68px)]'
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col mt-11">
          {navLinks.map((l) => (
            <a
              key={l.href + l.label}
              href={`/${l.href}`}
              className="py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] text-left tracking-[-0.045em]"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href={cvPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em]"
            onClick={() => setMenuOpen(false)}
          >
            Résumé <ArrowUR size={22} />
          </a>
        </nav>
      </div>

      <main className={`${WRAP} py-[clamp(32px,5vw,72px)]`}>
        {/* Center piece from the mock: form left, info right. Site tokens only. */}
        <section
          aria-label="Contact"
          className="grid min-h-[560px] grid-cols-2 overflow-hidden border border-line bg-surface max-[900px]:grid-cols-1"
        >
          <div className="flex justify-center items-center px-[clamp(28px,6vw,80px)] py-16">
            {status === 'sent' ? (
              <output className="w-full max-w-91.25">
                <p className="font-tight font-semibold text-[clamp(28px,3vw,40px)] tracking-[-0.04em]">
                  Message sent.
                </p>
                <p className="mt-3 text-[13px] text-dim leading-[1.7]">
                  Thanks for reaching out — I&apos;ll get back to you as soon as
                  I can.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-ink hover:opacity-80 focus-invert mt-8 px-6 py-3 font-medium text-[14px] text-bg transition-opacity duration-300"
                >
                  Back home
                </Link>
              </output>
            ) : (
              <form
                onSubmit={onSubmit}
                noValidate
                className="gap-6 grid w-full max-w-91.25"
              >
                <p className="font-bold text-[11px] text-dim2 uppercase tracking-[0.16em]">
                  Send a message
                </p>
                <label className="block">
                  <span className="sr-only">Your name</span>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) =>
                      handleFieldChange('name', e.target.value, setName)
                    }
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={
                      fieldErrors.name ? 'contact-name-error' : undefined
                    }
                    className={`w-full border-0 border-b bg-transparent pb-3 text-[15px] text-ink outline-none placeholder:text-dim ${
                      fieldErrors.name ? 'border-red-400' : 'border-edge'
                    }`}
                  />
                  <p
                    id="contact-name-error"
                    aria-live="polite"
                    className="mt-2 min-h-4 font-medium text-[12px] text-red-400 leading-4"
                  >
                    {fieldErrors.name ?? ''}
                  </p>
                </label>
                <label className="block">
                  <span className="sr-only">Your email</span>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={320}
                    placeholder="Your email"
                    value={email}
                    onChange={(e) =>
                      handleFieldChange('email', e.target.value, setEmail)
                    }
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                      fieldErrors.email ? 'contact-email-error' : undefined
                    }
                    className={`w-full border-0 border-b bg-transparent pb-3 text-[15px] text-ink outline-none placeholder:text-dim ${
                      fieldErrors.email ? 'border-red-400' : 'border-edge'
                    }`}
                  />
                  <p
                    id="contact-email-error"
                    aria-live="polite"
                    className="mt-2 min-h-4 font-medium text-[12px] text-red-400 leading-4"
                  >
                    {fieldErrors.email ?? ''}
                  </p>
                </label>
                <label className="block">
                  <span className="sr-only">Tell me about your project</span>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={3}
                    placeholder="Tell me about your project"
                    value={message}
                    onChange={(e) =>
                      handleFieldChange('message', e.target.value, setMessage)
                    }
                    aria-invalid={!!fieldErrors.message}
                    aria-describedby={
                      fieldErrors.message ? 'contact-message-error' : undefined
                    }
                    className={`min-h-14.5 w-full resize-none border-0 border-b bg-transparent pb-3 text-[15px] text-ink outline-none placeholder:text-dim ${
                      fieldErrors.message ? 'border-red-400' : 'border-edge'
                    }`}
                  />
                  <p
                    id="contact-message-error"
                    aria-live="polite"
                    className="mt-2 min-h-4 font-medium text-[12px] text-red-400 leading-4"
                  >
                    {fieldErrors.message ?? ''}
                  </p>
                </label>

                {/* Hidden robot trap: off-screen, not display:none so bots bite. */}
                <div
                  aria-hidden="true"
                  className="top-auto left-[-9999px] absolute w-px h-px overflow-hidden"
                >
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                <p
                  aria-live="polite"
                  className="min-h-4 font-medium text-[12px] text-red-400 leading-4"
                >
                  {status === 'error' ? error : ''}
                </p>

                <div className="relative mt-2">
                  <span
                    aria-hidden="true"
                    className="-top-0.75 -left-0.75 absolute border-[#ff3b00] border-t-[3px] border-l-[3px] w-[48%] h-6.5 pointer-events-none"
                  />
                  <span
                    aria-hidden="true"
                    className="-right-0.75 -bottom-0.75 absolute border-[#00a6ff] border-r-[3px] border-b-[3px] w-[66%] h-6 pointer-events-none"
                  />
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="z-2 relative bg-ink disabled:opacity-60 focus-invert border border-edge w-full min-h-15 font-semibold text-[14px] text-bg uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 duration-200 cursor-pointer"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="flex justify-center items-center px-[clamp(28px,6vw,70px)] py-18 max-[900px]:pt-5.5">
            <div className="relative flex flex-col justify-center px-12 py-13.5 w-full max-w-97.5 min-h-97.5">
              <svg
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                viewBox="0 0 390 390"
                aria-hidden="true"
              >
                <path
                  d="M116 15 C52 24 24 63 42 121 C55 160 89 196 119 236 C147 274 170 315 212 343 C253 371 305 353 321 305 C334 267 321 226 312 190 C301 147 296 104 263 68 C232 34 183 6 116 15Z"
                  fill="none"
                  stroke="var(--c-edge)"
                  strokeWidth="1.2"
                />
              </svg>
              <p className="z-1 relative mb-6 font-bold text-[11px] text-dim2 text-right uppercase tracking-[0.16em]">
                Contact
              </p>
              <h1 className="z-1 relative m-0 font-tight font-semibold text-[clamp(52px,5vw,72px)] text-right leading-[0.95] tracking-[-0.045em] [text-shadow:-2px_0_#ff3700,2px_0_#00a9ff]">
                <span className="block whitespace-nowrap">Get in</span>
                <span className="flex justify-end items-center gap-4.5 mt-4">
                  <span
                    aria-hidden="true"
                    className="inline-block bg-ink w-30 h-0.5 translate-y-1.5 [box-shadow:-1px_0_#ff3700,1px_0_#00a9ff]"
                  />
                  touch
                </span>
              </h1>
              <p className="z-1 relative mt-12 ml-auto w-62.5 text-[13px] text-dim leading-[1.55]">
                Have a project, idea, or opportunity in mind? Send me a message
                and I’ll get back to you as soon as I can.
              </p>
              {emailAddr && (
                <p className="z-1 relative mt-6 ml-auto w-62.5 font-semibold text-[12px] leading-[1.6]">
                  Prefer email?{' '}
                  <a
                    href={`mailto:${emailAddr}`}
                    className="hover:opacity-80 text-ink underline underline-offset-4"
                  >
                    {emailAddr}
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Slim site footer. */}
      <footer className="border-line border-t">
        <div
          className={`${WRAP} flex flex-wrap justify-between gap-x-6 gap-y-3 py-5 text-[11.5px] text-dim2`}
        >
          <span>
            Built by{' '}
            <strong className="font-semibold text-dim">
              {content?.site.author ?? 'Morteza Omar Mohammadi'}
            </strong>
          </span>
          {emailAddr && (
            <a
              href={`mailto:${emailAddr}`}
              className="hover:text-ink hover:underline"
            >
              {emailAddr}
            </a>
          )}
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      <div aria-hidden="true" className="site-cursor">
        <span className="cursor-default" aria-hidden="true" />
        <span className="cursor-interactive" aria-hidden="true" />
      </div>
    </>
  );
}
