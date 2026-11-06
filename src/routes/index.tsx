import { createFileRoute, Link } from '@tanstack/react-router';
import {
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ArrowR,
  ArrowUR,
  CheckIcon,
  CopyIcon,
  GhIcon,
  InIcon,
  MailIcon,
  XIcon,
} from '../components/icons';
import { Portrait } from '../components/portrait';
import type { FlowNode, PublicContent, SectionContent } from '../lib/content';
import { initPointerEffects } from '../lib/pointer-effects';
import { getContentFn } from '../server/content';

export const Route = createFileRoute('/')({
  loader: () => getContentFn(),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  headers: () => ({
    // Mirrors the nitro.config.ts ISR window.
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
  }),
  head: ({ loaderData }) => {
    const c = loaderData as PublicContent | undefined;
    const siteUrl = c?.site.siteUrl ?? 'https://mortezaom.dev';
    const title =
      c?.site.title ?? 'Morteza Omar Mohammadi — Full-Stack Software Engineer';
    const desc =
      c?.site.description ??
      'Full-stack software engineer leading production web and mobile products across backend services, payments, React, Node.js, and Flutter.';
    const socialDesc =
      c?.site.socialDescription ??
      'I build and lead reliable web and mobile products from backend services to production release.';
    const ogImage = c?.site.ogImage ?? `${siteUrl}/morteza-og.jpg`;
    const author = c?.site.author ?? 'Morteza Omar Mohammadi';
    const sameAs = c
      ? c.socials.filter((s) => s.icon !== 'mail').map((s) => s.href)
      : [];
    const profileLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: siteUrl,
      mainEntity: {
        '@type': 'Person',
        name: author,
        alternateName: 'mortezaom',
        url: siteUrl,
        image: ogImage,
        jobTitle: c?.profile.heroRole ?? 'Full-Stack Software Engineer',
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Herat University' },
        sameAs,
      },
    };
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { name: 'author', content: author },
        { property: 'og:type', content: 'profile' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: socialDesc },
        { property: 'og:url', content: siteUrl },
        { property: 'og:image', content: ogImage },
        {
          property: 'og:image:alt',
          content:
            c?.profile.portraitAlt ?? 'Portrait of Morteza Omar Mohammadi',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:creator',
          content: c?.site.twitterCreator ?? '@mortezaaom',
        },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: socialDesc },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [
        { rel: 'canonical', href: siteUrl },
        { rel: 'preload', href: '/morteza-800.webp', as: 'image' },
      ],
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(profileLd) },
      ],
    };
  },
  component: App,
});

const REVEAL =
  '[.js_&]:opacity-0 [.js_&]:translate-y-[26px] [transition:opacity_.8s_ease,transform_.9s_cubic-bezier(.22,1,.36,1)] [.js_&]:data-[v=on]:opacity-100 [.js_&]:data-[v=on]:translate-y-0 motion-reduce:transition-none';

const BTN =
  'focus-invert inline-flex items-center gap-2 bg-ink text-bg rounded-none text-[14px] font-medium transition-opacity duration-300 hover:opacity-80';

const WRAP = 'max-w-[1240px] mx-auto px-6';

const ANCHOR = 'scroll-mt-[84px]';

const SEC_H2 =
  'font-tight text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.045em]';
const SEC_P = 'mt-[14px] text-[14px] leading-[1.7] text-dim';

const LABEL2 = 'text-[12px] uppercase tracking-[.14em] text-dim2 font-semibold';

const META = 'text-[12.5px] text-dim2 leading-[1.6]';

const SQUARE_LINK =
  'flex justify-center items-center border border-edge hover:border-ink size-9 text-dim hover:text-ink transition-colors duration-300 shrink-0';

const FOOT_LINK =
  'block text-[13px] font-medium py-1 text-dim hover:text-ink hover:underline';

const SECTION_IDS = ['home', 'work', 'built', 'career', 'about', 'contact'];

const ICONS: Record<string, ComponentType> = {
  github: GhIcon,
  linkedin: InIcon,
  x: XIcon,
  mail: MailIcon,
};

const projectId = (name: string) =>
  `project-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/** Same header shape for every section; label matches the nav item. */
function SectionHeader(props: { s?: SectionContent; count?: string }) {
  return (
    <div data-reveal className={`${REVEAL} border-line border-t pt-5`}>
      <div className="flex justify-between items-baseline gap-4">
        <p className={LABEL2}>{props.s?.eyebrow}</p>
        {props.count && <p className={META}>{props.count}</p>}
      </div>
      <h2 className={`${SEC_H2} mt-4 max-w-[22ch]`}>{props.s?.title}</h2>
      {props.s?.copy && (
        <p className={`${SEC_P} max-w-[62ch]`}>{props.s.copy}</p>
      )}
    </div>
  );
}

/** A product's parts in order; filled = built by me, dashed = integrated. */
function FlowMap(props: { nodes: FlowNode[] }) {
  const mine = 'border-ink bg-ink/[.1]';
  const ext = 'border-dim2 border-dashed text-dim';
  return (
    <figure className="mt-7">
      <ol className="flex max-sm:flex-col flex-wrap items-stretch gap-y-2">
        {props.nodes.map((n, i) => (
          <li
            key={n.label + i}
            className="flex max-sm:flex-col items-center max-sm:items-stretch"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className="max-sm:self-center px-2 max-sm:px-0 text-dim2 max-sm:rotate-90"
              >
                →
              </span>
            )}
            <div className={`border px-3 py-2 ${n.mine ? mine : ext}`}>
              <span className="block font-semibold text-[13px] leading-tight">
                {n.label}
              </span>
              {n.detail && (
                <span className="block mt-0.5 text-[11.5px] text-dim">
                  {n.detail}
                </span>
              )}
              <span className="sr-only">
                {n.mine ? ' (built by me)' : ' (integrated service)'}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className={`${META} flex gap-5 mt-3`} aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className={`border size-3 ${mine}`} />
          Built by me
        </span>
        <span className="inline-flex items-center gap-2">
          <span className={`border size-3 ${ext}`} />
          Integrated
        </span>
      </figcaption>
    </figure>
  );
}

const decodeId = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function App() {
  const content = Route.useLoaderData();
  const profile = content.profile;
  const mailto = `mailto:${profile.email}`;
  const socials: [string, string, ComponentType][] = content.socials.map(
    (s) => [s.label, s.href, ICONS[s.icon] ?? GhIcon],
  );
  const spotlight = content.projects.filter((p) => p.kind === 'spotlight');
  const built = content.projects.filter((p) => p.kind !== 'spotlight');
  const firstYear = Math.min(
    ...content.experience.map((x) => Number(x.startDate.slice(0, 4))),
  );
  const careerSpan = Number.isFinite(firstYear)
    ? `${firstYear} – now`
    : undefined;
  const section = (key: string) => content.sections[key];

  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [copied, setCopied] = useState(false);

  useEffect(() => initPointerEffects(), []);

  const menuEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // In-page nav uses buttons that smooth-scroll; no anchor navigation.
  const goToSection = (href: string) => {
    const id = decodeId(href.slice(1));
    setMenuOpen(false);
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      if (id === 'main' && !target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    // Wait for the mobile menu's overflow unlock first.
    if (document.body.style.overflow === 'hidden') {
      window.setTimeout(() => requestAnimationFrame(scroll), 80);
    } else {
      requestAnimationFrame(scroll);
    }
  };

  const onSectionButtonClick =
    (href: string) => (_e: ReactMouseEvent<HTMLButtonElement>) => {
      goToSection(href);
    };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('menu-toggle')?.focus();
        return;
      }

      if (e.key !== 'Tab') return;
      const items =
        menuEl.current?.querySelectorAll<HTMLElement>('a[href], button');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => {
        el.setAttribute('data-v', 'on');
      });
    } else {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.setAttribute('data-v', 'on');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08 },
      );
      els.forEach((el) => {
        obs.observe(el);
      });

      const spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(e.target.id);
          }
        },
        { rootMargin: '-45% 0px -50% 0px' },
      );
      SECTION_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) spy.observe(el);
      });
      return () => {
        obs.disconnect();
        spy.disconnect();
      };
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={onSectionButtonClick('#main')}
        className="bg-ink px-5 py-3 rounded-none font-medium text-[13px] text-bg skip-link"
      >
        Skip to content
      </button>

      <header className="top-0 z-500 sticky bg-bg/85 backdrop-blur-md border-line border-b cursor-zone site-header halo-target halo-cell">
        <div className={`${WRAP} flex items-center justify-between h-17`}>
          <button
            type="button"
            onClick={onSectionButtonClick('#home')}
            className="font-tight font-bold text-[20px] tracking-[-0.03em]"
          >
            mortezaom
          </button>
          <nav aria-label="Main" className="max-nav:hidden flex gap-9">
            {content.navLinks.map((l) => (
              <button
                key={l.href + l.label}
                type="button"
                onClick={onSectionButtonClick(l.href)}
                aria-current={active === l.href.slice(1) ? 'true' : undefined}
                className="after:bottom-0 after:left-0 after:absolute relative after:bg-ink py-1 aria-[current]:after:w-full after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim aria-[current]:text-ink hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
              >
                {l.label}
              </button>
            ))}
            <a
              href={profile.cvPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex after:bottom-0 after:left-0 after:absolute relative items-center gap-1 after:bg-ink py-1 after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
            >
              Résumé <ArrowUR size={11} />
            </a>
          </nav>
          <Link to="/contact" className={`${BTN} px-5.5 py-2.5 max-nav:hidden`}>
            Contact me <ArrowR />
          </Link>
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
          {content.navLinks.map((l) => (
            <button
              key={l.href + l.label}
              type="button"
              className="py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em] text-left"
              onClick={onSectionButtonClick(l.href)}
            >
              {l.label}
            </button>
          ))}
          <a
            href={profile.cvPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em]"
            onClick={() => setMenuOpen(false)}
          >
            Résumé <ArrowUR size={22} />
          </a>
        </nav>
        <Link
          to="/contact"
          className={`${BTN} mt-auto justify-center px-4 py-3.25`}
          onClick={() => setMenuOpen(false)}
        >
          Contact me <ArrowR />
        </Link>
      </div>

      <main id="main">
        <section
          id="home"
          className={`${ANCHOR} relative isolate overflow-x-clip`}
        >
          <div
            className={`${WRAP} pt-[clamp(32px,4vw,56px)] pb-[clamp(48px,5vw,64px)]`}
          >
            <p className={LABEL2}>{profile.heroRole}</p>
            <h1 className="mt-4 font-tight font-semibold text-[clamp(34px,4.6vw,64px)] leading-[0.95]">
              {/* One line on wide screens so work shows in the first screen. */}
              {profile.heroName.map((line) => (
                <span key={line} className="inline-block mr-[0.28em]">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-[clamp(22px,2.6vw,34px)] max-w-[32ch] font-tight font-semibold text-[clamp(20px,2.4vw,30px)] leading-[1.2] tracking-[-0.02em]">
              {profile.heroTagline}
            </p>
            {profile.availability && (
              <p className="flex items-center gap-2.5 mt-5 text-[14px] text-dim">
                <span
                  aria-hidden="true"
                  className="bg-[#4ade80] rounded-full size-2 shrink-0"
                />
                {profile.availability}
              </p>
            )}
            <div className="flex flex-wrap justify-between items-center gap-x-8 gap-y-4 mt-8">
              <div className="flex max-sm:flex-wrap flex-nowrap gap-3">
                <button
                  type="button"
                  onClick={onSectionButtonClick('#work')}
                  className={`${BTN} px-6.5 py-2.75 shrink-0`}
                >
                  See my work <ArrowR />
                </button>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6.5 py-2.75 border border-edge hover:border-ink font-medium text-[14px] transition-colors duration-300"
                >
                  Contact me <ArrowR />
                </Link>
              </div>
              <div className="flex gap-7">
                {content.quickLinks.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${LABEL2} py-2 hover:text-ink transition-colors duration-300`}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <ul className="grid grid-cols-4 max-nav:grid-cols-2 mt-[clamp(32px,4vw,48px)] border-line border-t border-b cursor-zone">
              {content.stats.map((s, n) => (
                <li
                  key={s.value + s.label}
                  className={`min-w-0 p-[clamp(16px,2vw,24px)] halo-target halo-cell border-line ${
                    n > 0 ? 'border-l' : ''
                  } max-nav:[&:nth-child(odd)]:border-l-0 max-nav:[&:nth-child(n+3)]:border-t`}
                >
                  <p className="font-tight font-semibold text-[17px] tracking-[-0.02em]">
                    {s.value}
                  </p>
                  <p className="mt-1.5 text-[13.5px] text-dim leading-normal">
                    {s.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="work" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div className={WRAP}>
            <SectionHeader
              s={section('workSpotlight')}
              count={`${spotlight.length} products`}
            />
            <div className="gap-[clamp(20px,2.6vw,32px)] grid grid-cols-2 max-wide:grid-cols-1 mt-[clamp(28px,3.5vw,44px)]">
              {spotlight.map((project) => (
                <article
                  key={project.name}
                  id={projectId(project.name)}
                  data-reveal
                  className={`${REVEAL} ${ANCHOR} project-card halo-target flex flex-col border border-line bg-surface p-[clamp(22px,3vw,36px)]`}
                >
                  <p className={LABEL2}>{project.category}</p>
                  <h3 className="mt-3 font-tight font-semibold text-[clamp(28px,3.4vw,44px)] leading-none tracking-[-0.045em]">
                    {project.name}
                  </h3>
                  <p className={`${META} mt-3`}>{project.role}</p>
                  <p className="mt-5 max-w-[48ch] text-[clamp(16px,1.6vw,19px)] leading-normal">
                    {project.description}
                  </p>
                  {project.flow.length > 0 && <FlowMap nodes={project.flow} />}
                  {project.built.length > 0 && (
                    <ul className="gap-2 grid mt-6">
                      {project.built.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-[14px] text-dim leading-[1.55]"
                        >
                          <span aria-hidden="true" className="text-dim2">
                            —
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap justify-between items-end gap-4 mt-auto pt-7">
                    <p className={`${META} max-w-[46ch]`}>
                      {project.technologies.join(' · ')}
                    </p>
                    {project.href && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 pb-2 border-ink border-b font-semibold text-[13px]"
                      >
                        {project.linkLabel} <ArrowUR size={12} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="built" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div className={WRAP}>
            <SectionHeader
              s={section('workEngineering')}
              count={`${built.length} projects`}
            />
            <div className="gap-px grid grid-cols-3 max-wide:grid-cols-2 max-sm:grid-cols-1 bg-line mt-[clamp(28px,3.5vw,44px)] border border-line">
              {built.map((project) => (
                <article
                  key={project.name}
                  data-reveal
                  className={`${REVEAL} flex flex-col min-w-0 bg-bg p-[clamp(20px,2.4vw,28px)] halo-target halo-cell`}
                >
                  <p className={LABEL2}>
                    {[project.category, project.status]
                      .filter(Boolean)
                      .join(' · ') || 'Earlier work'}
                  </p>
                  <h3 className="mt-4 font-tight font-semibold text-[clamp(21px,2.2vw,26px)] leading-[1.1] tracking-[-0.035em]">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-2.5 text-[14px] text-dim leading-[1.6]">
                      {project.description}
                    </p>
                  )}
                  <div className="flex justify-between items-end gap-4 mt-auto pt-6">
                    <p className={META}>{project.technologies.join(' · ')}</p>
                    {project.href && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.linkLabel ?? 'Open'}: ${project.name}`}
                        className={SQUARE_LINK}
                      >
                        <ArrowUR size={13} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="career" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div className={WRAP}>
            <SectionHeader s={section('experience')} count={careerSpan} />
            <div
              data-reveal
              className={`${REVEAL} cursor-zone mt-[clamp(20px,2.5vw,32px)]`}
            >
              {content.experience.map((x) => {
                const linked = spotlight.find((p) => p.name === x.project);
                return (
                  <div
                    key={x.role + x.company + x.period}
                    className="items-start gap-6 max-nav:gap-1.5 grid grid-cols-[150px_1fr] max-nav:grid-cols-1 px-2.5 max-nav:px-1 py-6 border-line border-b halo-target halo-cell"
                  >
                    <span className="pt-1 max-nav:pt-0 text-[13px] text-dim2 whitespace-nowrap">
                      {x.period}
                    </span>
                    <div>
                      <h3 className="font-tight font-semibold text-[clamp(18px,1.9vw,22px)] tracking-tight">
                        {x.role}{' '}
                        <span className="font-medium text-dim">
                          · {x.company}
                        </span>
                      </h3>
                      {linked ? (
                        <button
                          type="button"
                          onClick={onSectionButtonClick(
                            `#${projectId(linked.name)}`,
                          )}
                          className="inline-flex items-center gap-1.5 mt-2 text-[14px] text-dim hover:text-ink underline underline-offset-4 decoration-edge hover:decoration-ink transition-colors duration-300"
                        >
                          See {linked.name} in Work{' '}
                          <span aria-hidden="true">↑</span>
                        </button>
                      ) : (
                        <p className="mt-2 max-w-[68ch] text-[14px] text-dim leading-[1.65]">
                          {x.description}
                        </p>
                      )}
                      <p className={`${META} mt-2.5`}>{x.stack.join(' · ')}</p>
                    </div>
                  </div>
                );
              })}
              <div className="items-start gap-6 max-nav:gap-3 grid grid-cols-[150px_1fr] max-nav:grid-cols-1 px-2.5 max-nav:px-1 py-6 border-line border-b">
                <span className="pt-0.5 text-[13px] text-dim2">
                  {section('skills')?.title ?? 'Toolbox'}
                </span>
                <dl className="gap-x-10 gap-y-3 grid grid-cols-2 max-sm:grid-cols-1">
                  {content.skillGroups.map((g) => (
                    <div key={g.name}>
                      <dt className={META}>{g.name}</dt>
                      <dd className="mt-0.5 text-[14px]">
                        {g.technologies.join(' · ')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div className={WRAP}>
            <SectionHeader s={section('about')} />
            <div className="items-center gap-[clamp(40px,7vw,96px)] grid grid-cols-[minmax(0,1fr)_minmax(320px,440px)] max-wide:grid-cols-1 mt-[clamp(28px,3.5vw,44px)] overflow-visible about-halo cursor-zone halo-target halo-cell">
              <div data-reveal className={REVEAL}>
                {profile.aboutParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className={`${i === 0 ? '' : 'mt-3'} max-w-[58ch] text-[clamp(15px,1.5vw,18px)] text-dim leading-[1.52] tracking-[-0.012em] [word-spacing:-0.035em]`}
                  >
                    {p}
                  </p>
                ))}
                <a
                  href={profile.cvPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-7 py-3 border-ink border-b font-semibold text-[13px]"
                >
                  Download résumé <ArrowUR size={12} />
                </a>
              </div>
              <Portrait
                className={`${REVEAL} max-wide:order-first`}
                alt={profile.portraitAlt}
              />
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className={`${ANCHOR} border-t border-line`}>
        <div className={WRAP}>
          <div
            data-reveal
            className={`${REVEAL} flex justify-between items-start gap-9 flex-wrap pt-[clamp(64px,8vw,104px)] pb-14`}
          >
            <div>
              <h2 className="font-tight font-semibold text-[clamp(28px,3.6vw,46px)] leading-[1.08] tracking-[-0.045em]">
                {profile.contactHeading}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[14px] text-dim leading-[1.7]">
                {profile.contactCopy}
              </p>
              {profile.availability && (
                <p className="flex items-center gap-2.5 mt-3 text-[13px] text-dim2">
                  <span
                    aria-hidden="true"
                    className="bg-[#4ade80] rounded-full size-2 shrink-0"
                  />
                  {profile.availability}
                </p>
              )}
              <Link to="/contact" className={`${BTN} px-5.5 py-2.5 mt-6`}>
                Get in touch <ArrowR />
              </Link>
            </div>
            <div className="flex flex-col items-end max-sm:items-start gap-3">
              <a
                className="inline-flex after:bottom-0 after:left-0 after:absolute relative items-center gap-2.5 after:bg-ink pb-1.5 after:w-full after:h-0.5 font-tight font-semibold text-[clamp(24px,3.4vw,44px)] after:content-[''] tracking-[-0.04em] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform motion-reduce:after:transition-none after:duration-450 after:ease-smooth"
                href={mailto}
              >
                {profile.email} <ArrowUR size={26} />
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex items-center gap-2 py-2 font-medium text-[12px] text-dim2 hover:text-ink transition-colors duration-300"
              >
                {copied ? (
                  <>
                    <CheckIcon /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon /> Copy address
                  </>
                )}
              </button>
              <span aria-live="polite" className="sr-only">
                {copied ? 'Email address copied to clipboard' : ''}
              </span>
            </div>
          </div>

          <div
            data-reveal
            className={`${REVEAL} flex justify-between gap-11 flex-wrap pt-2 pb-15 max-sm:flex-col max-sm:gap-8`}
          >
            <div className="flex gap-2.5 -ml-1">
              {socials.map(([label, href, Icon]) => (
                <a
                  key={label + href}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={
                    href.startsWith('mailto:')
                      ? undefined
                      : 'noopener noreferrer'
                  }
                  className="group flex justify-center items-center focus-invert size-11"
                >
                  <span className="flex justify-center items-center group-hover:bg-ink border border-edge group-hover:border-ink rounded-none size-9.5 text-dim group-hover:text-bg transition-all duration-300">
                    <Icon />
                  </span>
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-18">
              <div>
                <h3 className={`${LABEL2} mb-3.5`}>Menu</h3>
                {content.navLinks.map((l) => (
                  <button
                    key={l.href + l.label}
                    type="button"
                    onClick={onSectionButtonClick(l.href)}
                    className={`${FOOT_LINK} text-left`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div>
                <h3 className={`${LABEL2} mb-3.5`}>Resources</h3>
                {content.footerLinks.map((l) =>
                  l.href.startsWith('#') ? (
                    <button
                      key={l.href + l.label}
                      type="button"
                      onClick={onSectionButtonClick(l.href)}
                      className={`${FOOT_LINK} text-left`}
                    >
                      {l.label}
                    </button>
                  ) : (
                    <a
                      key={l.href + l.label}
                      href={l.href}
                      target={
                        l.href.startsWith('mailto:') ? undefined : '_blank'
                      }
                      rel={
                        l.href.startsWith('mailto:')
                          ? undefined
                          : 'noopener noreferrer'
                      }
                      className={FOOT_LINK}
                    >
                      {l.label}
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 py-5 border-line border-t text-[11.5px] text-dim2">
            <span>
              Built by{' '}
              <strong className="font-semibold text-dim">
                {content.site.author}
              </strong>
            </span>
            <span>© {new Date().getFullYear()}</span>
            <span>React · TanStack Start · TypeScript</span>
          </div>
        </div>

        <div className="overflow-hidden select-none" aria-hidden="true">
          <h2 className="font-tight font-semibold text-[14.6vw] text-ghost text-center leading-[.78] tracking-[-0.055em] whitespace-nowrap translate-y-[.14em]">
            mortezaom
          </h2>
        </div>
      </footer>

      <div aria-hidden="true" className="site-cursor">
        <span className="cursor-default" aria-hidden="true" />
        <span className="cursor-interactive" aria-hidden="true" />
      </div>
    </>
  );
}
