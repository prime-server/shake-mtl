interface TickerProps {
  text?: string;
  speed?: number;
  className?: string;
}

const DEFAULT_TEXT =
  'SMOOTHIES \u{1F964} MATCHA \u{1F375} COFFEE \u2615 COLD-PRESSED JUICES \u{1F9C3} WELLNESS SHOTS \u26A1 PROTEIN \u{1F4AA} FRESH DAILY \u{1F33F}';

export default function Ticker({ text = DEFAULT_TEXT, speed = 30, className = '' }: TickerProps) {
  const repeated = `${text} \u00A0\u00A0\u00A0 ${text} \u00A0\u00A0\u00A0 ${text} \u00A0\u00A0\u00A0 `;

  return (
    <div className={`ticker ${className}`}>
      <div
        className="ticker-track"
        style={{ animationDuration: `${speed}s` }}
      >
        <span className="ticker-text">{repeated}</span>
        <span className="ticker-text">{repeated}</span>
      </div>
    </div>
  );
}
