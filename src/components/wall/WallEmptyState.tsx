interface Props {
  filter: string;
  onActionClick?: () => void;
}

export default function WallEmptyState({ filter }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center select-none">
      {/* Hand-drawn monoline sketch illustration: Meditating Creative Brain character */}
      <div className="relative w-52 h-44 mb-3 flex items-center justify-center">
        <svg
          viewBox="0 0 200 170"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Floating creative spark doodles around head */}
          {/* Top lightbulb spark */}
          <g transform="translate(90, 8)">
            <path
              d="M 10,2 C 14,2 17,5 17,9 C 17,12 15,14 14,16 L 6,16 C 5,14 3,12 3,9 C 3,5 6,2 10,2 Z"
              fill="#ffe95c"
              stroke="#1a3300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="10" y1="-3" x2="10" y2="0" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="2" x2="0" y2="0" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" />
            <line x1="17" y1="2" x2="20" y2="0" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Left star spark */}
          <path
            d="M 28,45 L 31,52 L 38,54 L 32,58 L 34,65 L 28,61 L 22,65 L 24,58 L 18,54 L 25,52 Z"
            fill="#ffe95c"
            stroke="#1a3300"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Right creative burst */}
          <g transform="translate(162, 50)">
            <path d="M 0,5 L 12,5 M 6,-1 L 6,11 M 2,1 L 10,9 M 10,1 L 2,9" stroke="#cb5521" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Meditating Creative Brain Lobe - Left (Pastel Teal #a8e5e5 fill) */}
          <path
            d="M 98,42 C 86,40 76,46 70,54 C 62,50 50,56 46,68 C 42,80 48,92 54,98 C 48,106 52,118 64,122 C 76,126 88,120 98,114 Z"
            fill="var(--color-sticky-note-teal)"
            stroke="#1a3300"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Meditating Creative Brain Lobe - Right (Pastel Mint #d5f5c2 fill) */}
          <path
            d="M 102,42 C 114,40 124,46 130,54 C 138,50 150,56 154,68 C 158,80 152,92 146,98 C 152,106 148,118 136,122 C 124,126 112,120 102,114 Z"
            fill="var(--color-sticky-note-mint)"
            stroke="#1a3300"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Brain sulcus folds (sketch lines) */}
          <path
            d="M 72,56 C 80,62 82,74 74,82 C 68,88 74,98 84,100"
            stroke="#1a3300"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 128,56 C 120,62 118,74 126,82 C 132,88 126,98 116,100"
            stroke="#1a3300"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Brain center division */}
          <path
            d="M 100,42 L 100,114"
            stroke="#1a3300"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Serene Meditating Face (closed happy eyes + smile) */}
          {/* Left Eye */}
          <path d="M 78,82 C 81,85 86,85 89,82" stroke="#1a3300" strokeWidth="2.4" strokeLinecap="round" />
          {/* Right Eye */}
          <path d="M 111,82 C 114,85 119,85 122,82" stroke="#1a3300" strokeWidth="2.4" strokeLinecap="round" />
          {/* Gentle Smile */}
          <path d="M 94,94 C 97,97 103,97 106,94" stroke="#1a3300" strokeWidth="2.2" strokeLinecap="round" />
          {/* Cute blush marks */}
          <ellipse cx="73" cy="88" rx="4" ry="2" fill="#f6d0ff" opacity="0.8" />
          <ellipse cx="127" cy="88" rx="4" ry="2" fill="#f6d0ff" opacity="0.8" />

          {/* Meditating Arms (hands resting gently) */}
          <path
            d="M 52,106 C 42,118 48,130 64,130 C 74,130 84,124 90,118"
            stroke="#1a3300"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 148,106 C 158,118 152,130 136,130 C 126,130 116,124 110,118"
            stroke="#1a3300"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Crossed Lotus Legs / Base */}
          <path
            d="M 48,142 C 60,132 82,132 100,138 C 118,132 140,132 152,142 C 142,154 118,154 100,149 C 82,154 58,154 48,142 Z"
            fill="#fcfaf5"
            stroke="#1a3300"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="144" r="3" fill="#ffe95c" stroke="#1a3300" strokeWidth="1.5" />

          {/* Ground reflection shadow / ripple */}
          <ellipse cx="100" cy="160" rx="46" ry="4" fill="rgba(26, 51, 0, 0.08)" />
          <ellipse cx="100" cy="162" rx="28" ry="2" fill="rgba(26, 51, 0, 0.05)" />
        </svg>
      </div>

      {/* Clean, simple centered empty state message in #1a3300 (Nanum Pen Script, 25px) */}
      <p
        className="font-hand text-center max-w-sm leading-tight mt-3 -rotate-1 select-none"
        style={{
          fontFamily: 'var(--font-hand)',
          color: '#1a3300',
          fontSize: '25px',
        }}
      >
        {filter === 'Admin Drops'
          ? 'No admin drops yet — check back soon!'
          : 'Nothing posted on the Team Wall yet — be the first to share!'}
      </p>
    </div>
  );
}
