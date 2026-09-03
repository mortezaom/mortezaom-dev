import { useEffect, useRef, useState } from 'react';

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
  const [initial, setInitial] = useState(true);
  const [frame, setFrame] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timers = useRef<number[]>([]);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timers.current.push(timer);
      return timer;
    };

    const finish = () => {
      document.documentElement.classList.remove('intro-active');
      propsRef.current.onComplete();
    };

    document.documentElement.classList.add('intro-active');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    const glyphTimer = window.setInterval(
      () => setFrame((value) => value + 1),
      90,
    );
    timers.current.push(glyphTimer);
    later(() => setInitial(false), 420);

    const beginReveal = () => {
      let visible = 0;
      const revealTimer = window.setInterval(() => {
        setRevealed(++visible);
        if (visible < CHARACTER_COUNT) return;

        window.clearInterval(revealTimer);
        window.clearInterval(glyphTimer);
        later(() => {
          propsRef.current.onExit();
          setExiting(true);
          later(finish, 540);
        }, 800);
      }, 24);
      timers.current.push(revealTimer);
    };

    const minimum = new Promise<void>((resolve) => later(resolve, 820));
    const font =
      document.fonts?.load('600 96px Syne', NAME.join(' ')) ??
      Promise.resolve();
    const maximum = new Promise<void>((resolve) => later(resolve, 980));
    Promise.race([Promise.all([minimum, font]), maximum]).then(beginReveal);

    const copy = [...timers.current];
    return () => {
      copy.forEach((timer) => {
        window.clearTimeout(timer);
      });
      timers.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('intro-active');
      }
    };
  }, []);

  let offset = 0;

  return (
    <output
      className={`intro-loader${exiting ? ' is-exiting' : ''}`}
      aria-label="Opening Morteza Omar Mohammadi's portfolio"
    >
      <div className="intro-loader__panels" aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="intro-loader__panel" />
        ))}
      </div>

      <div className="intro-loader__identity" aria-hidden="true">
        <div className="intro-loader__name">
          {!initial ? (
            NAME.map((line) => {
              const lineOffset = offset;
              offset += line.length;
              return (
                <span key={line} className="intro-loader__line">
                  {revealed >= lineOffset + line.length
                    ? line
                    : line.split('').map((character, idx) => {
                        const position = lineOffset + idx;
                        return (
                          // biome-ignore lint/suspicious/noArrayIndexKey: character position is the identity
                          <span key={idx}>
                            {position < revealed
                              ? character
                              : glyph(position, frame)}
                          </span>
                        );
                      })}
                </span>
              );
            })
          ) : (
            <>
              <span className="intro-loader__line">LOADING</span>
              {INITIAL_RANDOM_LENGTHS.map((length, line) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed 2-line placeholder, order never changes
                <span key={line} className="intro-loader__line">
                  {Array.from({ length }).map((_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: glyph position is the identity
                    <span key={index}>{glyph(line * 8 + index, frame)}</span>
                  ))}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      <span
        className="intro-loader__meta intro-loader__meta--left"
        aria-hidden="true"
      >
        Full-stack software engineer
      </span>
      <span
        className="intro-loader__meta intro-loader__meta--right"
        aria-hidden="true"
      >
        Web · Backend · Mobile
      </span>
    </output>
  );
}
