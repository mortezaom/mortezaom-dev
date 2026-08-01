import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';

const NAME = ['MORTEZA', 'OMAR', 'MOHAMMADI'] as const;
const INITIAL_RANDOM_LENGTHS = [7, 8] as const;
const GLYPHS = [
  '0',
  '1',
  '+',
  '×',
  '/',
  '\\',
  '[',
  ']',
  '{',
  '}',
  '<',
  '>',
  ':',
  '_',
  '—',
] as const;
const CHARACTER_COUNT = NAME.join('').length;

const glyph = (index: number, frame: number) =>
  GLYPHS[Math.abs(index * 17 + frame * 11 + index * frame * 3) % GLYPHS.length];

export function IntroLoader(props: {
  onExit: () => void;
  onComplete: () => void;
}) {
  const [initial, setInitial] = createSignal(true);
  const [frame, setFrame] = createSignal(0);
  const [revealed, setRevealed] = createSignal(0);
  const [exiting, setExiting] = createSignal(false);
  const timers: number[] = [];

  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  };

  const finish = () => {
    document.documentElement.classList.remove('intro-active');
    props.onComplete();
  };

  onMount(() => {
    document.documentElement.classList.add('intro-active');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    const glyphTimer = window.setInterval(
      () => setFrame((value) => value + 1),
      90,
    );
    timers.push(glyphTimer);
    later(() => setInitial(false), 420);

    const beginReveal = () => {
      let visible = 0;
      const revealTimer = window.setInterval(() => {
        setRevealed(++visible);
        if (visible < CHARACTER_COUNT) return;

        window.clearInterval(revealTimer);
        window.clearInterval(glyphTimer);
        later(() => {
          props.onExit();
          setExiting(true);
          later(finish, 540);
        }, 800);
      }, 24);
      timers.push(revealTimer);
    };

    const minimum = new Promise<void>((resolve) => later(resolve, 820));
    const font =
      document.fonts?.load('600 96px Syne', NAME.join(' ')) ??
      Promise.resolve();
    const maximum = new Promise<void>((resolve) => later(resolve, 980));
    Promise.race([Promise.all([minimum, font]), maximum]).then(beginReveal);
  });

  onCleanup(() => {
    timers.forEach((timer) => {
      window.clearTimeout(timer);
    });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('intro-active');
    }
  });

  let offset = 0;

  return (
    <output
      class={`intro-loader${exiting() ? ' is-exiting' : ''}`}
      aria-label="Opening Morteza Omar Mohammadi's portfolio"
    >
      <div class="intro-loader__panels" aria-hidden="true">
        <For each={[0, 1, 2, 3]}>
          {() => <div class="intro-loader__panel" />}
        </For>
      </div>

      <div class="intro-loader__identity" aria-hidden="true">
        <div class="intro-loader__name">
          <Show
            when={!initial()}
            fallback={
              <>
                <span class="intro-loader__line">LOADING</span>
                <For each={INITIAL_RANDOM_LENGTHS}>
                  {(length, line) => (
                    <span class="intro-loader__line">
                      <For each={Array.from({ length })}>
                        {(_, index) => (
                          <span>{glyph(line() * 8 + index(), frame())}</span>
                        )}
                      </For>
                    </span>
                  )}
                </For>
              </>
            }
          >
            <For each={NAME}>
              {(line) => {
                const lineOffset = offset;
                offset += line.length;
                return (
                  <span class="intro-loader__line">
                    <Show
                      when={revealed() >= lineOffset + line.length}
                      fallback={
                        <For each={line.split('')}>
                          {(character, index) => {
                            const position = lineOffset + index();
                            return (
                              <span>
                                <Show
                                  when={position < revealed()}
                                  fallback={glyph(position, frame())}
                                >
                                  {character}
                                </Show>
                              </span>
                            );
                          }}
                        </For>
                      }
                    >
                      {line}
                    </Show>
                  </span>
                );
              }}
            </For>
          </Show>
        </div>
      </div>

      <span
        class="intro-loader__meta intro-loader__meta--left"
        aria-hidden="true"
      >
        Full-stack software engineer
      </span>
      <span
        class="intro-loader__meta intro-loader__meta--right"
        aria-hidden="true"
      >
        Web · Backend · Mobile
      </span>
    </output>
  );
}
