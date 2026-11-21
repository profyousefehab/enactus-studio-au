export default function BackgroundWave() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 480 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large sweeping pastel Mint (#d5f5c2) hand-brushed wave */}
        <g opacity="0.32">
          {/* Main brush wave body */}
          <path
            d="M 520,120 C 420,180 340,160 260,250 C 180,340 220,440 120,530 C 40,600 -20,620 -60,700 C -40,730 20,720 80,680 C 180,620 180,500 280,410 C 370,330 420,310 500,240 C 530,210 540,160 520,120 Z"
            fill="var(--color-sticky-note-mint)"
          />
          {/* Secondary painterly brush trail with textured taper */}
          <path
            d="M 490,90 C 390,150 310,135 230,225 C 150,315 190,415 90,505 C 10,575 -50,595 -90,675 C -75,695 -20,685 40,645 C 140,585 140,465 240,375 C 330,295 380,275 460,205 C 490,175 510,130 490,90 Z"
            fill="var(--color-sticky-note-mint)"
            opacity="0.5"
          />
          {/* Tiny gestural dry-brush splatters/specks */}
          <circle cx="340" cy="200" r="3" fill="var(--color-sticky-note-mint)" />
          <circle cx="210" cy="310" r="2.5" fill="var(--color-sticky-note-mint)" />
          <circle cx="150" cy="460" r="3.5" fill="var(--color-sticky-note-mint)" />
          <circle cx="70" cy="560" r="2" fill="var(--color-sticky-note-mint)" />
        </g>
      </svg>
    </div>
  );
}
