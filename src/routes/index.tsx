import { createFileRoute } from '@tanstack/react-router';
import {
  type ComponentType,
  Fragment,
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
import type { PublicContent } from '../lib/content';
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
  'font-tight text-[clamp(32px,4.4vw,50px)] font-semibold tracking-[-0.045em]';
const SEC_P = 'mt-[14px] text-[13px] leading-[1.7] text-dim';

const LABEL2 = 'text-[11px] uppercase tracking-[.16em] text-dim2 font-semibold';

const TAG =
  'text-[11px] font-medium text-dim2 border border-line rounded-none px-2.5 py-1';

const FOOT_LINK =
  'block text-[13px] font-medium py-1 text-dim hover:text-ink hover:underline';

const SECTION_IDS = [
  'home',
  'about',
  'work',
  'experience',
  'skills',
  'contact',
];

const ICONS: Record<string, ComponentType> = {
  github: GhIcon,
  linkedin: InIcon,
  x: XIcon,
  mail: MailIcon,
};

function App() {
  const content = Route.useLoaderData();
  const profile = content.profile;
  const mailto = `mailto:${profile.email}`;
  const socials: [string, string, ComponentType][] = content.socials.map(
    (s) => [s.label, s.href, ICONS[s.icon] ?? GhIcon],
  );
  const spotlight = content.projects.filter((p) => p.kind === 'spotlight');
  const engineering = content.projects.filter((p) => p.kind === 'engineering');
  const archive = content.projects.filter((p) => p.kind === 'archive');
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
      <a
        href="#main"
        className="bg-ink px-5 py-3 rounded-none font-medium text-[13px] text-bg skip-link"
      >
        Skip to content
      </a>

      <header className="top-0 z-500 sticky bg-bg/85 backdrop-blur-md border-line border-b cursor-zone site-header halo-target halo-cell">
        <div className={`${WRAP} flex items-center justify-between h-17`}>
          <a
            href="#home"
            className="font-tight font-bold text-[20px] tracking-[-0.03em]"
          >
            mortezaom
          </a>
          <nav aria-label="Main" className="max-nav:hidden flex gap-9">
            {content.navLinks.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                aria-current={active === l.href.slice(1) ? 'true' : undefined}
                className="after:bottom-0 after:left-0 after:absolute relative after:bg-ink py-1 aria-[current]:after:w-full after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim aria-[current]:text-ink hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
              >
                {l.label}
              </a>
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
          <a href={mailto} className={`${BTN} px-5.5 py-2.5 max-nav:hidden`}>
            Contact me <ArrowR />
          </a>
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
            <a
              key={l.href + l.label}
              href={l.href}
              className="py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em]"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
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
        <a
          href={mailto}
          className={`${BTN} mt-auto justify-center px-4 py-3.25`}
          onClick={() => setMenuOpen(false)}
        >
          Contact me <ArrowR />
        </a>
      </div>

      <main id="main">
        <section
          id="home"
          className={`${ANCHOR} relative isolate overflow-x-clip`}
        >
          <div className={`${WRAP} relative`}>
            <div className="flex flex-col pt-[clamp(24px,3.5vw,52px)] min-[1200px]:min-h-[calc(100svh-68px)]">
              <div className="py-[clamp(28px,5vw,72px)] max-w-280">
                <div>
                  <h1 className="font-tight font-semibold text-[clamp(42px,7.2vw,118px)] leading-[0.85]">
                    {profile.heroName.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </h1>
                  <p className={`${LABEL2} mt-[clamp(18px,2vw,28px)] text-dim`}>
                    {profile.heroRole}
                  </p>
                </div>
              </div>

              <div className="flex max-[1100px]:flex-col justify-between items-center max-[1100px]:items-start gap-8 max-[1100px]:gap-6 mt-[clamp(28px,4vw,52px)] py-[clamp(20px,2.6vw,30px)] border-line border-t overflow-visible cursor-zone halo-target halo-cell">
                <p className="font-tight font-semibold text-[clamp(16px,1.8vw,23px)] leading-[1.2] tracking-[-0.02em]">
                  {profile.heroTagline}
                </p>
                <div className="flex max-sm:flex-wrap flex-nowrap gap-3">
                  <a href="#work" className={`${BTN} px-6.5 py-2.75 shrink-0`}>
                    View my work <ArrowR />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-6.5 py-2.75 border border-edge hover:border-ink font-medium text-[14px] transition-colors duration-300"
                  >
                    Contact me <ArrowR />
                  </a>
                </div>
              </div>

              <div className="flex justify-end max-nav:justify-start gap-8 py-2 border-line border-t">
                {content.quickLinks.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${LABEL2} py-3.5 hover:text-ink transition-colors duration-300`}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex-1" aria-hidden="true" />
            </div>

            <div
              data-reveal
              className={`${REVEAL} cursor-zone halo-target frame-card overflow-hidden mt-[clamp(36px,5vw,76px)] rounded-none bg-surface p-[clamp(26px,4vw,54px)] grid gap-[clamp(32px,4vw,48px)]`}
            >
              <span className="halo-light" aria-hidden="true" />
              <div className="z-1 relative">
                <h2 className="font-tight font-semibold text-[clamp(26px,3.4vw,44px)] leading-[1.04] tracking-[-0.045em]">
                  {profile.heroCardTitle}
                </h2>
                <p className="mt-4 max-w-[62ch] text-[13px] text-dim leading-[1.75]">
                  {profile.heroCardCopy}
                </p>
              </div>
              <div className="z-1 relative grid grid-cols-3">
                {content.stats.map((s, n) => (
                  <div
                    key={s.label + s.value}
                    className={`min-w-0 text-center px-[clamp(8px,1.6vw,22px)] ${
                      n > 0 ? 'border-l border-line' : ''
                    }`}
                  >
                    <div className="font-tight font-semibold text-[clamp(16px,2.2vw,30px)] leading-none tracking-[-0.035em] whitespace-nowrap">
                      {s.value}
                    </div>
                    <div className="block mt-3 font-semibold text-[9px] text-dim2 sm:text-[11px] uppercase tracking-[.06em] sm:tracking-[.16em]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className={`${ANCHOR} py-[clamp(72px,9vw,120px)]`}>
          <div
            className={`${WRAP} about-halo cursor-zone halo-target halo-cell overflow-visible grid grid-cols-[minmax(0,1fr)_minmax(380px,520px)] gap-[clamp(48px,8vw,112px)] items-center max-wide:grid-cols-1`}
          >
            <div data-reveal className={REVEAL}>
              <h2 className={SEC_H2}>
                {section('about')?.title ?? 'About me'}
              </h2>
              {profile.aboutParagraphs.map((p, i) => (
                <p
                  key={i}
                  className={`${i === 0 ? 'mt-6' : 'mt-3'} max-w-[58ch] text-[clamp(15px,1.5vw,18px)] text-dim leading-[1.52] tracking-[-0.012em] [word-spacing:-0.035em]`}
                >
                  {p}
                </p>
              ))}
              <a
                href={profile.cvPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-7 py-3 border-ink border-b font-semibold text-[12.5px]"
              >
                Download résumé <ArrowUR size={12} />
              </a>
            </div>

            <Portrait
              className={`${REVEAL} max-wide:order-first`}
              alt={profile.portraitAlt}
            />
          </div>
        </section>

        <section id="work" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div className={WRAP}>
            <div data-reveal className={`${REVEAL} max-w-170`}>
              <p className={LABEL2}>{section('workSpotlight')?.eyebrow}</p>
              <h2 className="mt-3 font-tight font-semibold text-[clamp(28px,3.8vw,44px)] leading-[1.08] tracking-[-0.045em]">
                {section('workSpotlight')?.title}
              </h2>
              <p className={SEC_P}>{section('workSpotlight')?.copy}</p>
            </div>
            <div className="mt-[clamp(44px,5vw,64px)] border-line border-t">
              {spotlight.map((project) => (
                <article
                  key={project.name}
                  data-reveal
                  className={`${REVEAL} project-card halo-target grid grid-cols-[.72fr_1.28fr] gap-[clamp(28px,6vw,80px)] border-b border-line py-[clamp(36px,5vw,64px)] last:border-b-0 max-wide:grid-cols-1 max-wide:gap-6`}
                >
                  <div>
                    <p className={LABEL2}>{project.category}</p>
                    <h3 className="mt-3 font-tight font-semibold text-[clamp(30px,4.4vw,54px)] tracking-[-0.045em]">
                      {project.name}
                    </h3>
                    <p
                      className={`${LABEL2} mt-4 normal-case tracking-[.04em]`}
                    >
                      {project.role}
                    </p>
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="max-w-[54ch] text-[clamp(17px,2vw,22px)] leading-normal">
                      {project.description}
                    </p>
                    <p className="mt-4 max-w-[66ch] text-[13px] text-dim leading-[1.7]">
                      {project.ownership}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {project.technologies.map((technology) => (
                        <span key={technology} className={TAG}>
                          {technology}
                        </span>
                      ))}
                    </div>
                    {project.href && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-7 pb-2 border-ink border-b font-semibold text-[12.5px]"
                      >
                        {project.linkLabel} <ArrowUR size={12} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-[clamp(96px,12vw,160px)]">
              <div data-reveal className={`${REVEAL} max-w-155`}>
                <p className={LABEL2}>{section('workEngineering')?.eyebrow}</p>
                <h3 className="mt-3 font-tight font-semibold text-[clamp(24px,3vw,36px)] leading-[1.08] tracking-[-0.04em]">
                  {section('workEngineering')?.title}
                </h3>
                <p className={SEC_P}>{section('workEngineering')?.copy}</p>
              </div>
              <div className="gap-x-[clamp(32px,6vw,80px)] grid grid-cols-2 max-nav:grid-cols-1 mt-10 border-line border-t">
                {engineering.map((project, index) => (
                  <article
                    key={project.name}
                    data-reveal
                    className={`${REVEAL} grid grid-cols-[42px_1fr] gap-5 border-b border-line py-[clamp(30px,4vw,44px)]`}
                  >
                    <span className="pt-1 font-tight font-semibold text-[12px] text-dim2 select-none">
                      0{index + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex justify-between items-center gap-4">
                        <p className={LABEL2}>{project.category}</p>
                        {project.status && (
                          <p className="flex items-center gap-2 font-semibold text-[10px] text-dim2 uppercase tracking-[.12em]">
                            <span
                              className="bg-dim2 size-1.5"
                              aria-hidden="true"
                            />
                            {project.status}
                          </p>
                        )}
                      </div>
                      <h4 className="mt-5 font-tight font-semibold text-[clamp(21px,2.4vw,29px)] leading-[1.1] tracking-[-0.035em]">
                        {project.name}
                      </h4>
                      <p className="mt-3 max-w-[54ch] text-[13px] text-dim leading-[1.7]">
                        {project.description}
                      </p>
                      <div className="flex max-sm:flex-col justify-between items-end max-sm:items-start gap-5 mt-auto pt-7">
                        <div className="flex flex-wrap gap-1.5">
                          {project.technologies.map((technology) => (
                            <span key={technology} className={TAG}>
                              {technology}
                            </span>
                          ))}
                        </div>
                        {project.href && (
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.linkLabel}: ${project.name}`}
                            className="flex justify-center items-center border border-edge hover:border-ink size-9 text-dim hover:text-ink transition-colors duration-300 shrink-0"
                          >
                            <ArrowUR size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-[clamp(96px,12vw,160px)]">
              <div data-reveal className={`${REVEAL} max-w-155`}>
                <p className={LABEL2}>{section('workArchive')?.eyebrow}</p>
                <h3 className="mt-3 font-tight font-semibold text-[clamp(24px,3vw,36px)] leading-[1.08] tracking-[-0.04em]">
                  {section('workArchive')?.title}
                </h3>
              </div>
              <div className="mt-9 border-line border-t">
                {archive.map((project) => (
                  <article
                    key={project.name}
                    data-reveal
                    className={`${REVEAL} flex items-center justify-between gap-8 border-b border-line py-6 max-sm:flex-col max-sm:items-start max-sm:gap-4`}
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="font-tight font-semibold text-[clamp(20px,2.5vw,28px)] tracking-[-0.03em]">
                        {project.name}
                      </h4>
                      {project.href && (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${project.name}`}
                          className="text-dim hover:text-ink transition-colors duration-300"
                        >
                          <ArrowUR size={14} />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((technology) => (
                        <span key={technology} className={TAG}>
                          {technology}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="experience"
          className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}
        >
          <div className={WRAP}>
            <div
              data-reveal
              className={`${REVEAL} text-center max-w-155 mx-auto`}
            >
              <h2 className={SEC_H2}>
                {section('experience')?.title ?? 'Experience'}
              </h2>
              <p className={SEC_P}>{section('experience')?.copy}</p>
            </div>
            <div
              data-reveal
              className={`${REVEAL} cursor-zone mt-[clamp(40px,5vw,56px)] border-t border-line`}
            >
              {content.experience.map((x) => (
                <div key={x.role + x.company + x.period}>
                  <div className="items-start gap-6 max-nav:gap-2 grid grid-cols-[150px_1fr] max-nav:grid-cols-1 px-2.5 max-nav:px-1 py-8 max-nav:py-6.5 border-line border-b halo-target halo-cell">
                    <span className="pt-1.5 max-nav:pt-0 font-medium text-[12px] text-dim2 whitespace-nowrap">
                      {x.period}
                    </span>
                    <div>
                      <h3 className="font-tight font-semibold text-[clamp(19px,2vw,24px)] tracking-tight">
                        {x.role}{' '}
                        <span className="font-medium text-dim">
                          · {x.company}
                        </span>
                      </h3>
                      <p className="mt-2 max-w-[68ch] text-[12.5px] text-dim leading-[1.65]">
                        {x.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {x.stack.map((t) => (
                          <span key={t} className={TAG}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div
            className={`${WRAP} grid grid-cols-[1fr_1.35fr] gap-16 items-start max-wide:grid-cols-1 max-wide:gap-11`}
          >
            <div data-reveal className={REVEAL}>
              <h2 className="font-tight font-semibold text-[clamp(30px,3.6vw,46px)] leading-[1.06] tracking-[-0.045em]">
                {(section('skills')?.title ?? '').split('\n').map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </Fragment>
                ))}
              </h2>
            </div>
            <div data-reveal className={`${REVEAL} frame-card`}>
              <div className="grid grid-cols-2 max-sm:grid-cols-1 border-line border-t border-l">
                {content.skillGroups.map((group) => (
                  <div
                    key={group.name}
                    className="p-[clamp(22px,3vw,34px)] border-line border-r border-b min-h-42.5 text-center halo-target halo-cell"
                  >
                    <h3 className={LABEL2}>{group.name}</h3>
                    <div className="flex flex-wrap justify-center gap-y-2 mt-6">
                      {group.technologies.map((technology, index) => (
                        <span
                          key={technology}
                          className="font-semibold text-[14px] text-dim hover:text-ink transition-colors duration-300"
                        >
                          {technology}
                          {index < group.technologies.length - 1 && (
                            <span aria-hidden="true" className="mx-3 text-dim2">
                              •
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
              <p className="mt-4 max-w-[46ch] text-[12.5px] text-dim2 leading-[1.7]">
                {profile.contactCopy}
              </p>
              <a className={`${BTN} px-5.5 py-2.5 mt-6`} href={mailto}>
                Get in touch <ArrowUR />
              </a>
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
                  <a key={l.href + l.label} href={l.href} className={FOOT_LINK}>
                    {l.label}
                  </a>
                ))}
              </div>
              <div>
                <h3 className={`${LABEL2} mb-3.5`}>Resources</h3>
                {content.footerLinks.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    target={
                      l.href.startsWith('mailto:') || l.href.startsWith('#')
                        ? undefined
                        : '_blank'
                    }
                    rel={
                      l.href.startsWith('mailto:') || l.href.startsWith('#')
                        ? undefined
                        : 'noopener noreferrer'
                    }
                    className={FOOT_LINK}
                  >
                    {l.label}
                  </a>
                ))}
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
