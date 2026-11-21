interface Props {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}

/**
 * Horizontal scrollable filter pills.
 * Active: Forest Ink fill + Cream text. Inactive: Cream fill + pencil border.
 */
export default function FilterPills({ options, active, onChange }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      style={{ scrollbarWidth: 'none' }}
    >
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt)}
            className="whitespace-nowrap px-4 py-2 text-sm font-medium cursor-pointer pill-spring shrink-0"
            style={{
              fontFamily: 'var(--font-inter)',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isActive ? 'var(--color-forest-ink)' : 'var(--color-cream-paper)',
              color: isActive ? 'var(--color-cream-paper)' : 'var(--color-forest-ink)',
              border: isActive ? '1px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
