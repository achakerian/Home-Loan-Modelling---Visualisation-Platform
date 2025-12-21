import ThemeToggle from './ThemeToggle.tsx';

type AppHeaderProps = {
  onShowDisclaimer: () => void;
  compact?: boolean;
};

const AppHeader = ({ onShowDisclaimer, compact = false }: AppHeaderProps) => {
  return (
    <header className={`bg-primary px-4 text-white ${compact ? 'py-2' : 'py-4'} sticky top-0 z-40`}>
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <h1 className={`font-semibold ${compact ? 'text-lg' : 'text-xl'}`}>Australian Financial Calculator</h1>
          {!compact && (
            <button
              type="button"
              onClick={onShowDisclaimer}
              className="mt-1 flex items-center gap-2 text-sm text-white/80"
            >
              There's always a disclaimer
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/70 text-[9px] font-bold">
                i
              </span>
            </button>
          )}
        </div>
        <ThemeToggle compact={compact} />
      </div>
    </header>
  );
};

export default AppHeader;
