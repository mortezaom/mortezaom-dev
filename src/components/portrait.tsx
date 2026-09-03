export function Portrait(props: { className?: string; alt?: string }) {
  return (
    <div
      data-reveal
      className={`${props.className ?? ''} portrait-slices`}
      role="img"
      aria-label={props.alt ?? 'Portrait of Morteza Omar Mohammadi'}
    >
      <div className="portrait-slices__stage" aria-hidden="true">
        <svg
          className="portrait-slices__image"
          viewBox="0 0 520 520"
          role="presentation"
        >
          <defs>
            <radialGradient id="portrait-edge-fade">
              <stop offset="72%" stopColor="white" />
              <stop offset="100%" stopColor="black" />
            </radialGradient>
            <mask id="portrait-soft-mask">
              <rect
                x="-5"
                y="-5"
                width="530"
                height="530"
                rx="110"
                fill="url(#portrait-edge-fade)"
              />
            </mask>
          </defs>
          <g
            className="portrait-slices__backdrop"
            transform="translate(260 260) scale(1.2) rotate(-35) translate(-260 -260)"
          >
            <rect x="130" y="140" width="230" height="37" rx="18.5" />
            <circle cx="395" cy="158.5" r="13" />
            <rect x="160" y="191" width="200" height="37" rx="18.5" />
            <rect x="88" y="242" width="300" height="37" rx="18.5" />
            <circle cx="53" cy="260.5" r="13" />
            <rect x="157.5" y="293" width="205" height="37" rx="18.5" />
            <rect x="176" y="344" width="220" height="37" rx="18.5" />
            <circle cx="431" cy="362.5" r="13" />
          </g>
          <image
            href="/morteza-800.webp"
            x="-5"
            y="-5"
            width="530"
            height="530"
            preserveAspectRatio="xMidYMid meet"
            mask="url(#portrait-soft-mask)"
          />
        </svg>
      </div>
    </div>
  );
}
