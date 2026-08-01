import { createFileRoute } from '@tanstack/solid-router';
import {
  type Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { Motion } from 'solid-motionone';
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
import {
  ARCHIVE_PROJECTS,
  CV,
  EMAIL,
  ENGINEERING_PROJECTS,
  EXPERIENCE,
  MAILTO,
  NAV_LINKS,
  QUICK_LINKS,
  SECTION_IDS,
  SKILL_GROUPS,
  SPOTLIGHT_PROJECTS,
  STATS,
} from '../portfolio-data';

export const Route = createFileRoute('/')({ component: App });

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

const SOCIALS: [string, string, Component][] = [
  ['GitHub', 'https://github.com/mortezaom', GhIcon],
  ['LinkedIn', 'https://linkedin.com/in/mortezaom', InIcon],
  ['X', 'https://x.com/mortezaaom', XIcon],
  ['Email', MAILTO, MailIcon],
];

function App() {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [active, setActive] = createSignal('home');
  const [copied, setCopied] = createSignal(false);
  const [customCursor, setCustomCursor] = createSignal({
    x: 0,
    y: 0,
    visible: false,
  });

  const trackCursor = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;

    if (target.classList.contains('halo-target')) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    }
  };

  onMount(() => {
    let revealTimer = 0;
    const trackPointer = (event: MouseEvent) =>
      setCustomCursor((cursor) => {
        if (!cursor.visible && !revealTimer) {
          revealTimer = window.setTimeout(() => {
            revealTimer = 0;
            setCustomCursor((current) => ({ ...current, visible: true }));
          }, 60);
        }
        return {
          x: event.clientX,
          y: event.clientY,
          visible: cursor.visible,
        };
      });
    const hidePointer = () => {
      clearTimeout(revealTimer);
      revealTimer = 0;
      setCustomCursor((cursor) => ({ ...cursor, visible: false }));
    };

    window.addEventListener('mousemove', trackPointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', hidePointer);
    onCleanup(() => {
      clearTimeout(revealTimer);
      window.removeEventListener('mousemove', trackPointer);
      document.documentElement.removeEventListener('mouseleave', hidePointer);
    });
  });

  let menuEl!: HTMLDivElement;

  createEffect(() => {
    document.body.style.overflow = menuOpen() ? 'hidden' : '';
    onCleanup(() => {
      document.body.style.overflow = '';
    });
  });

  createEffect(() => {
    document.documentElement.classList.toggle(
      'custom-cursor-active',
      customCursor().visible,
    );
    onCleanup(() => {
      document.documentElement.classList.remove('custom-cursor-active');
    });
  });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 2000);
      onCleanup(() => clearTimeout(t));
    } catch {
      setCopied(false);
    }
  };

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!menuOpen()) return;

      if (e.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('menu-toggle')?.focus();
        return;
      }

      if (e.key !== 'Tab') return;
      const items = menuEl.querySelectorAll<HTMLElement>('a[href], button');
      if (!items.length) return;
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
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  onMount(() => {
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
      onCleanup(() => obs.disconnect());
    }

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
    onCleanup(() => spy.disconnect());
  });

  return (
    <>
      <a
        href="#main"
        class="bg-ink px-5 py-3 rounded-none font-medium text-[13px] text-bg skip-link"
      >
        Skip to content
      </a>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor and highlight */}
      <header
        class="top-0 z-500 sticky bg-bg/85 backdrop-blur-md border-line border-b cursor-zone site-header halo-target halo-cell"
        onMouseMove={trackCursor}
      >
        <div class={`${WRAP} flex items-center justify-between h-17`}>
          <a
            href="#home"
            class="font-tight font-bold text-[20px] tracking-[-0.03em]"
          >
            mortezaom
          </a>
          <nav aria-label="Main" class="max-nav:hidden flex gap-9">
            <For each={NAV_LINKS}>
              {(l) => (
                <a
                  href={l.href}
                  aria-current={
                    active() === l.href.slice(1) ? 'true' : undefined
                  }
                  class="after:bottom-0 after:left-0 after:absolute relative after:bg-ink py-1 aria-[current]:after:w-full after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim aria-[current]:text-ink hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
                >
                  {l.label}
                </a>
              )}
            </For>
            <a
              href={CV}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex after:bottom-0 after:left-0 after:absolute relative items-center gap-1 after:bg-ink py-1 after:w-0 hover:after:w-full after:h-[1.5px] font-medium text-[14px] text-dim hover:text-ink after:content-[''] transition-colors after:transition-[width] duration-300 after:duration-300"
            >
              Résumé <ArrowUR size={11} />
            </a>
          </nav>
          <a href={MAILTO} class={`${BTN} px-5.5 py-2.5 max-nav:hidden`}>
            Contact me <ArrowR />
          </a>
          <button
            id="menu-toggle"
            type="button"
            class="hidden relative max-nav:flex flex-col justify-center items-center -mr-2.5 size-11"
            aria-label={menuOpen() ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen()}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              class={`absolute w-5.5 h-0.5 bg-ink transition-transform duration-300 ${
                menuOpen() ? 'rotate-45' : '-translate-y-1.75'
              }`}
            />
            <span
              class={`absolute w-5.5 h-0.5 bg-ink transition-opacity duration-200 ${
                menuOpen() ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              class={`absolute w-5.5 h-0.5 bg-ink transition-transform duration-300 ${
                menuOpen() ? '-rotate-45' : 'translate-y-1.75'
              }`}
            />
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuEl}
        inert={menuOpen() ? undefined : true}
        aria-hidden={!menuOpen()}
        class={`hidden max-nav:flex fixed inset-0 bg-bg z-400 flex-col pt-17 px-6 pb-8 transition-transform duration-550 ease-smooth motion-reduce:transition-none ${
          menuOpen() ? 'translate-y-0' : '-translate-y-[calc(100%+68px)]'
        }`}
      >
        <nav aria-label="Mobile" class="flex flex-col mt-11">
          <For each={NAV_LINKS}>
            {(l) => (
              <a
                href={l.href}
                class="py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em]"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            )}
          </For>
          <a
            href={CV}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-3 py-3 border-line border-b font-tight font-semibold text-[clamp(34px,9vw,52px)] tracking-[-0.045em]"
            onClick={() => setMenuOpen(false)}
          >
            Résumé <ArrowUR size={22} />
          </a>
        </nav>
        <a
          href={MAILTO}
          class={`${BTN} mt-auto justify-center px-4 py-3.25`}
          onClick={() => setMenuOpen(false)}
        >
          Contact me <ArrowR />
        </a>
      </div>

      <main id="main">
        <section id="home" class={`${ANCHOR} relative isolate overflow-x-clip`}>
          <div class={`${WRAP} relative`}>
            <div class="flex flex-col pt-[clamp(24px,3.5vw,52px)] min-[1200px]:min-h-[calc(100svh-68px)]">
              <div class="py-[clamp(28px,5vw,72px)] max-w-280">
                <div>
                  <h1 class="font-tight font-semibold text-[clamp(42px,7.2vw,118px)] leading-[0.85]">
                    <span class="block">MORTEZA</span>
                    <span class="block">OMAR</span>
                    <span class="block">MOHAMMADI</span>
                  </h1>
                  <p class={`${LABEL2} mt-[clamp(18px,2vw,28px)] text-dim`}>
                    Full-Stack Software Engineer
                  </p>
                </div>
              </div>

              {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor and highlight */}
              <div
                class="flex max-[1100px]:flex-col justify-between items-center max-[1100px]:items-start gap-8 max-[1100px]:gap-6 mt-[clamp(28px,4vw,52px)] py-[clamp(20px,2.6vw,30px)] border-line border-t overflow-visible cursor-zone halo-target halo-cell"
                onMouseMove={trackCursor}
              >
                <p class="font-tight font-semibold text-[clamp(16px,1.8vw,23px)] leading-[1.2] tracking-[-0.02em]">
                  I design systems, lead development, and ship reliable
                  products.
                </p>
                <div class="flex max-sm:flex-wrap flex-nowrap gap-3">
                  <a href="#work" class={`${BTN} px-6.5 py-2.75 shrink-0`}>
                    View my work <ArrowR />
                  </a>
                  <a
                    href="#contact"
                    class="inline-flex items-center gap-2 px-6.5 py-2.75 border border-edge hover:border-ink font-medium text-[14px] transition-colors duration-300"
                  >
                    Contact me <ArrowR />
                  </a>
                </div>
              </div>

              <div class="flex justify-end max-nav:justify-start gap-8 py-2 border-line border-t">
                <For each={QUICK_LINKS}>
                  {([label, href]) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      class={`${LABEL2} py-3.5 hover:text-ink transition-colors duration-300`}
                    >
                      {label}
                    </a>
                  )}
                </For>
              </div>
              <div class="flex-1" aria-hidden="true" />
            </div>

            {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor and highlight */}
            <div
              data-reveal
              class={`${REVEAL} cursor-zone halo-target frame-card mt-[clamp(36px,5vw,76px)] rounded-none bg-surface p-[clamp(26px,4vw,54px)] grid gap-[clamp(32px,4vw,48px)]`}
              onMouseMove={trackCursor}
            >
              <span class="halo-overlay" aria-hidden="true" />
              <div class="z-1 relative">
                <h2 class="font-tight font-semibold text-[clamp(26px,3.4vw,44px)] leading-[1.04] tracking-[-0.045em]">
                  Shipping products end to end
                </h2>
                <p class="mt-4 max-w-[62ch] text-[13px] text-dim leading-[1.75]">
                  Building production backend, web, and mobile products since
                  2020.
                </p>
              </div>
              <div class="z-1 relative grid grid-cols-3">
                <For each={STATS}>
                  {([value, label], n) => (
                    <div
                      class={`min-w-0 text-center px-[clamp(8px,1.6vw,22px)] ${
                        n() > 0 ? 'border-l border-line' : ''
                      }`}
                    >
                      <div class="font-tight font-semibold text-[clamp(16px,2.2vw,30px)] leading-none tracking-[-0.035em] whitespace-nowrap">
                        {value}
                      </div>
                      <div class="block mt-3 font-semibold text-[9px] text-dim2 sm:text-[11px] uppercase tracking-[.06em] sm:tracking-[.16em]">
                        {label}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <section id="about" class={`${ANCHOR} py-[clamp(72px,9vw,120px)]`}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor and highlight */}
          <div
            class={`${WRAP} about-halo cursor-zone halo-target halo-cell overflow-visible grid grid-cols-[minmax(0,1fr)_minmax(380px,520px)] gap-[clamp(48px,8vw,112px)] items-center max-wide:grid-cols-1`}
            onMouseMove={trackCursor}
          >
            <div data-reveal class={REVEAL}>
              <h2 class={SEC_H2}>About me</h2>
              <p class="mt-6 max-w-[58ch] text-[clamp(15px,1.5vw,18px)] text-dim leading-[1.52] tracking-[-0.012em] [word-spacing:-0.035em]">
                I’m a full-stack software engineer who takes products from the
                first data model to production release. I work across backend
                services, payments, web applications, and Flutter mobile apps,
                and I lead remote delivery for ticketing and mobility products.
              </p>
              <p class="mt-3 max-w-[58ch] text-[clamp(15px,1.5vw,18px)] text-dim leading-[1.52] tracking-[-0.012em] [word-spacing:-0.035em]">
                I care about clear ownership, maintainable code, reliable
                releases, and software that feels simple to use.
              </p>
              <a
                href={CV}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 mt-7 py-3 border-ink border-b font-semibold text-[12.5px]"
              >
                Download résumé <ArrowUR size={12} />
              </a>
            </div>

            <Portrait class={`${REVEAL} max-wide:order-first`} />
          </div>
        </section>

        <section id="work" class={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div class={WRAP}>
            <div data-reveal class={`${REVEAL} max-w-170`}>
              <p class={LABEL2}>Spotlight</p>
              <h2 class="mt-3 font-tight font-semibold text-[clamp(28px,3.8vw,44px)] leading-[1.08] tracking-[-0.045em]">
                Work that defines what I do now.
              </h2>
              <p class={SEC_P}>
                Production products where I own major parts of the engineering,
                from system design and backend services to customer-facing web
                and mobile experiences.
              </p>
            </div>
            <div class="mt-[clamp(44px,5vw,64px)] border-line border-t">
              <For each={SPOTLIGHT_PROJECTS}>
                {(project) => (
                  <article
                    data-reveal
                    class={`${REVEAL} project-card halo-target grid grid-cols-[.72fr_1.28fr] gap-[clamp(28px,6vw,80px)] border-b border-line py-[clamp(36px,5vw,64px)] last:border-b-0 max-wide:grid-cols-1 max-wide:gap-6`}
                    onMouseMove={trackCursor}
                  >
                    <div>
                      <p class={LABEL2}>{project.category}</p>
                      <h3 class="mt-3 font-tight font-semibold text-[clamp(30px,4.4vw,54px)] tracking-[-0.045em]">
                        {project.name}
                      </h3>
                      <p class={`${LABEL2} mt-4 normal-case tracking-[.04em]`}>
                        {project.role}
                      </p>
                    </div>
                    <div class="flex flex-col items-start">
                      <p class="max-w-[54ch] text-[clamp(17px,2vw,22px)] leading-normal">
                        {project.description}
                      </p>
                      <p class="mt-4 max-w-[66ch] text-[13px] text-dim leading-[1.7]">
                        {project.ownership}
                      </p>
                      <div class="flex flex-wrap gap-1.5 mt-5">
                        <For each={project.technologies}>
                          {(technology) => (
                            <span class={TAG}>{technology}</span>
                          )}
                        </For>
                      </div>
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 mt-7 pb-2 border-ink border-b font-semibold text-[12.5px]"
                      >
                        {project.linkLabel} <ArrowUR size={12} />
                      </a>
                    </div>
                  </article>
                )}
              </For>
            </div>

            <div class="mt-[clamp(96px,12vw,160px)]">
              <div data-reveal class={`${REVEAL} max-w-155`}>
                <p class={LABEL2}>Under the Hood</p>
                <h3 class="mt-3 font-tight font-semibold text-[clamp(24px,3vw,36px)] leading-[1.08] tracking-[-0.04em]">
                  Focused systems and engineering work.
                </h3>
                <p class={SEC_P}>
                  Open-source projects, backend systems, and technical builds
                  that explore a specific problem in more depth.
                </p>
              </div>
              <div class="gap-x-[clamp(32px,6vw,80px)] grid grid-cols-2 max-nav:grid-cols-1 mt-10 border-line border-t">
                <For each={ENGINEERING_PROJECTS}>
                  {(project, index) => (
                    <article
                      data-reveal
                      class={`${REVEAL} grid grid-cols-[42px_1fr] gap-5 border-b border-line py-[clamp(30px,4vw,44px)]`}
                    >
                      <span class="pt-1 font-tight font-semibold text-[12px] text-dim2 select-none">
                        0{index() + 1}
                      </span>
                      <div class="flex flex-col min-w-0">
                        <div class="flex justify-between items-center gap-4">
                          <p class={LABEL2}>{project.category}</p>
                          <p class="flex items-center gap-2 font-semibold text-[10px] text-dim2 uppercase tracking-[.12em]">
                            <span class="bg-dim2 size-1.5" aria-hidden="true" />
                            {project.status}
                          </p>
                        </div>
                        <h4 class="mt-5 font-tight font-semibold text-[clamp(21px,2.4vw,29px)] leading-[1.1] tracking-[-0.035em]">
                          {project.name}
                        </h4>
                        <p class="mt-3 max-w-[54ch] text-[13px] text-dim leading-[1.7]">
                          {project.description}
                        </p>
                        <div class="flex max-sm:flex-col justify-between items-end max-sm:items-start gap-5 mt-auto pt-7">
                          <div class="flex flex-wrap gap-1.5">
                            <For each={project.technologies}>
                              {(technology) => (
                                <span class={TAG}>{technology}</span>
                              )}
                            </For>
                          </div>
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.linkLabel}: ${project.name}`}
                            class="flex justify-center items-center border border-edge hover:border-ink size-9 text-dim hover:text-ink transition-colors duration-300 shrink-0"
                          >
                            <ArrowUR size={13} />
                          </a>
                        </div>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </div>

            <div class="mt-[clamp(96px,12vw,160px)]">
              <div data-reveal class={`${REVEAL} max-w-155`}>
                <p class={LABEL2}>From the Archive</p>
                <h3 class="mt-3 font-tight font-semibold text-[clamp(24px,3vw,36px)] leading-[1.08] tracking-[-0.04em]">
                  Earlier work that shaped my experience.
                </h3>
              </div>
              <div class="mt-9 border-line border-t">
                <For each={ARCHIVE_PROJECTS}>
                  {(project) => (
                    <article
                      data-reveal
                      class={`${REVEAL} flex items-center justify-between gap-8 border-b border-line py-6 max-sm:flex-col max-sm:items-start max-sm:gap-4`}
                    >
                      <div class="flex items-center gap-3">
                        <h4 class="font-tight font-semibold text-[clamp(20px,2.5vw,28px)] tracking-[-0.03em]">
                          {project.name}
                        </h4>
                        <Show when={project.href}>
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${project.name}`}
                            class="text-dim hover:text-ink transition-colors duration-300"
                          >
                            <ArrowUR size={14} />
                          </a>
                        </Show>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <For each={project.technologies}>
                          {(technology) => (
                            <span class={TAG}>{technology}</span>
                          )}
                        </For>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" class={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div class={WRAP}>
            <div
              data-reveal
              class={`${REVEAL} text-center max-w-155 mx-auto`}
            >
              <h2 class={SEC_H2}>Experience</h2>
              <p class={SEC_P}>
                My work has progressed from web and mobile development to
                leading complete product builds across backend, web, mobile, and
                payments.
              </p>
            </div>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor */}
            <div
              data-reveal
              class={`${REVEAL} cursor-zone mt-[clamp(40px,5vw,56px)] border-t border-line`}
              onMouseMove={trackCursor}
            >
              <For each={EXPERIENCE}>
                {(x) => (
                  <>
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative highlight */}
                    <div
                      class="items-start gap-6 max-nav:gap-2 grid grid-cols-[150px_1fr] max-nav:grid-cols-1 px-2.5 max-nav:px-1 py-8 max-nav:py-6.5 border-line border-b halo-target halo-cell"
                      onMouseMove={trackCursor}
                    >
                      <span class="pt-1.5 max-nav:pt-0 font-medium text-[12px] text-dim2 whitespace-nowrap">
                        {x.period}
                      </span>
                      <div>
                        <h3 class="font-tight font-semibold text-[clamp(19px,2vw,24px)] tracking-tight">
                          {x.role}{' '}
                          <span class="font-medium text-dim">
                            · {x.company}
                          </span>
                        </h3>
                        <p class="mt-2 max-w-[68ch] text-[12.5px] text-dim leading-[1.65]">
                          {x.desc}
                        </p>
                        <div class="flex flex-wrap gap-1.5 mt-3.5">
                          <For each={x.stack}>
                            {(t) => <span class={TAG}>{t}</span>}
                          </For>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </For>
            </div>
          </div>
        </section>

        <section id="skills" class={`${ANCHOR} pb-[clamp(72px,9vw,120px)]`}>
          <div
            class={`${WRAP} grid grid-cols-[1fr_1.35fr] gap-16 items-start max-wide:grid-cols-1 max-wide:gap-11`}
          >
            <div data-reveal class={REVEAL}>
              <h2 class="font-tight font-semibold text-[clamp(30px,3.6vw,46px)] leading-[1.06] tracking-[-0.045em]">
                Tools I use to
                <br />
                build and ship
              </h2>
            </div>
            <div data-reveal class={`${REVEAL} frame-card`}>
              <div class="grid grid-cols-2 max-sm:grid-cols-1 border-line border-t border-l">
                <For each={SKILL_GROUPS}>
                  {(group) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: mouse movement only positions a decorative cursor and highlight
                    <div
                      class="p-[clamp(22px,3vw,34px)] border-line border-r border-b min-h-42.5 text-center halo-target halo-cell"
                      onMouseMove={trackCursor}
                    >
                      <h3 class={LABEL2}>{group.name}</h3>
                      <div class="flex flex-wrap justify-center gap-y-2 mt-6">
                        <For each={group.technologies}>
                          {(technology, index) => (
                            <span class="font-semibold text-[14px] text-dim hover:text-ink transition-colors duration-300">
                              {technology}
                              <Show
                                when={index() < group.technologies.length - 1}
                              >
                                <span aria-hidden="true" class="mx-3 text-dim2">
                                  •
                                </span>
                              </Show>
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" class={`${ANCHOR} border-t border-line`}>
        <div class={WRAP}>
          <div
            data-reveal
            class={`${REVEAL} flex justify-between items-start gap-9 flex-wrap pt-[clamp(64px,8vw,104px)] pb-14`}
          >
            <div>
              <h2 class="font-tight font-semibold text-[clamp(28px,3.6vw,46px)] leading-[1.08] tracking-[-0.045em]">
                Let’s talk.
              </h2>
              <p class="mt-4 max-w-[46ch] text-[12.5px] text-dim2 leading-[1.7]">
                Have a question or want to discuss an opportunity? Send me a
                message.
              </p>
              <a class={`${BTN} px-5.5 py-2.5 mt-6`} href={MAILTO}>
                Get in touch <ArrowUR />
              </a>
            </div>
            <div class="flex flex-col items-end max-sm:items-start gap-3">
              <a
                class="inline-flex after:bottom-0 after:left-0 after:absolute relative items-center gap-2.5 after:bg-ink pb-1.5 after:w-full after:h-0.5 font-tight font-semibold text-[clamp(24px,3.4vw,44px)] after:content-[''] tracking-[-0.04em] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform motion-reduce:after:transition-none after:duration-450 after:ease-smooth"
                href={MAILTO}
              >
                {EMAIL} <ArrowUR size={26} />
              </a>
              <button
                type="button"
                onClick={copyEmail}
                class="inline-flex items-center gap-2 py-2 font-medium text-[12px] text-dim2 hover:text-ink transition-colors duration-300"
              >
                <Show
                  when={copied()}
                  fallback={
                    <>
                      <CopyIcon /> Copy address
                    </>
                  }
                >
                  <CheckIcon /> Copied
                </Show>
              </button>
              <span aria-live="polite" class="sr-only">
                {copied() ? 'Email address copied to clipboard' : ''}
              </span>
            </div>
          </div>

          <div
            data-reveal
            class={`${REVEAL} flex justify-between gap-11 flex-wrap pt-2 pb-15 max-sm:flex-col max-sm:gap-8`}
          >
            <div class="flex gap-2.5 -ml-1">
              <For each={SOCIALS}>
                {([label, href, Icon]) => (
                  <a
                    href={href}
                    aria-label={label}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={
                      href.startsWith('mailto:')
                        ? undefined
                        : 'noopener noreferrer'
                    }
                    class="group flex justify-center items-center focus-invert size-11"
                  >
                    <span class="flex justify-center items-center group-hover:bg-ink border border-edge group-hover:border-ink rounded-none size-9.5 text-dim group-hover:text-bg transition-all duration-300">
                      <Icon />
                    </span>
                  </a>
                )}
              </For>
            </div>
            <div class="flex flex-wrap gap-18">
              <div>
                <h3 class={`${LABEL2} mb-3.5`}>Menu</h3>
                <For each={NAV_LINKS}>
                  {(l) => (
                    <a href={l.href} class={FOOT_LINK}>
                      {l.label}
                    </a>
                  )}
                </For>
              </div>
              <div>
                <h3 class={`${LABEL2} mb-3.5`}>Resources</h3>
                <a
                  href={CV}
                  target="_blank"
                  rel="noopener noreferrer"
                  class={FOOT_LINK}
                >
                  Résumé (PDF)
                </a>
                <a
                  href="https://github.com/mortezaom"
                  target="_blank"
                  rel="noopener noreferrer"
                  class={FOOT_LINK}
                >
                  GitHub
                </a>
                <a href={MAILTO} class={FOOT_LINK}>
                  Email
                </a>
                <a
                  href="https://bilit.events"
                  target="_blank"
                  rel="noopener noreferrer"
                  class={FOOT_LINK}
                >
                  bilit.events
                </a>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-between gap-x-6 gap-y-3 py-5 border-line border-t text-[11.5px] text-dim2">
            <span>
              Built by{' '}
              <strong class="font-semibold text-dim">
                Morteza Omar Mohammadi
              </strong>
            </span>
            <span>© {new Date().getFullYear()}</span>
            <span>Solid · TanStack Start · TypeScript</span>
          </div>
        </div>

        <div class="overflow-hidden select-none" aria-hidden="true">
          <h2 class="font-tight font-semibold text-[14.6vw] text-ghost text-center leading-[.78] tracking-[-0.055em] whitespace-nowrap translate-y-[.14em]">
            mortezaom
          </h2>
        </div>
      </footer>

      <Motion.div
        aria-hidden="true"
        class="site-cursor"
        initial={{ opacity: 0 }}
        animate={{
          x: customCursor().x - 9,
          y: customCursor().y - 9,
          opacity: customCursor().visible ? 1 : 0,
        }}
        transition={{
          duration: customCursor().visible ? 0.045 : 0,
          easing: 'ease-out',
          opacity: { duration: 0.08 },
        }}
      />
    </>
  );
}
