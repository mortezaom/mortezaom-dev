import { Link } from '@tanstack/react-router';
import { ArrowR, ArrowUR } from './icons';

const WRAP = 'max-w-[1240px] mx-auto px-6';
const BTN =
  'focus-invert inline-flex items-center gap-2 bg-ink text-bg rounded-none text-[14px] font-medium transition-opacity duration-300 hover:opacity-80';
const LABEL = 'text-[11px] uppercase tracking-[.16em] text-dim2 font-semibold';

export function SiteNotFound() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden select-none">
      <header className="z-10 bg-bg/85 backdrop-blur-md border-line border-b">
        <div className={`${WRAP} flex items-center justify-between h-17`}>
          <Link
            to="/"
            className="font-tight font-bold text-[20px] tracking-[-0.03em]"
          >
            mortezaom
          </Link>
          <Link to="/" className={`${BTN} px-5.5 py-2.5`}>
            Back home <ArrowR />
          </Link>
        </div>
      </header>

      <main className={`${WRAP} z-10 flex w-full flex-1 items-center py-8`}>
        <section>
          <p className={LABEL}>404 — Page not found</p>
          <h1 className="mt-4 font-tight font-semibold text-[clamp(56px,10vw,128px)] leading-[0.85] tracking-[-0.055em]">
            404
          </h1>
          <p className="mt-5 font-tight font-semibold text-[clamp(19px,2.4vw,30px)] leading-[1.1] tracking-[-0.03em]">
            This page doesn&apos;t exist.
          </p>
          <p className="mt-3 max-w-[56ch] text-[13px] text-dim leading-[1.7]">
            The link you followed may be broken, or the page may have moved.
            Head back home or get in touch and I&apos;ll point you the right
            way.
          </p>
          <div className="flex max-sm:flex-col max-sm:items-stretch gap-3 mt-7">
            <Link to="/" className={`${BTN} px-6.5 py-2.75 justify-center`}>
              Back home <ArrowR />
            </Link>
            <a
              href="/#contact"
              className="inline-flex justify-center items-center gap-2 px-6.5 py-2.75 border border-edge hover:border-ink font-medium text-[14px] transition-colors duration-300"
            >
              Contact me <ArrowUR size={12} />
            </a>
          </div>
        </section>
      </main>

      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden select-none pointer-events-none"
        aria-hidden="true"
      >
        <p className="font-tight font-semibold text-[24vw] text-ghost text-center leading-[.78] tracking-[-0.055em] whitespace-nowrap translate-y-[.18em]">
          404
        </p>
      </div>
    </div>
  );
}
