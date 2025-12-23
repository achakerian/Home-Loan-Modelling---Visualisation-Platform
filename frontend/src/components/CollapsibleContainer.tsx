import React from 'react';

type Accent = 'slate' | 'blue' | 'purple';

type CollapsibleContainerProps = {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  padded?: boolean;
  accent?: Accent;
};

const accentStyles: Record<Accent, string> = {
  slate:
    'bg-white text-brand-800 border-white shadow-sm hover:bg-white/90 dark:bg-white/10 dark:border-white/40 dark:text-white',
  blue:
    'bg-brand-500/15 text-brand-700 border-brand-200 shadow-sm hover:bg-brand-500/25 dark:bg-brand-400/15 dark:border-brand-400/40 dark:text-brand-100',
  purple:
    'bg-purple-200/40 text-purple-700 border-purple-200 shadow-sm hover:bg-purple-200/60 dark:bg-purple-300/10 dark:border-purple-300/40 dark:text-purple-100',
};

export const CollapsibleContainer: React.FC<CollapsibleContainerProps> = ({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  padded = true,
  accent = 'slate',
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section
      className={`space-y-3 rounded-3xl border border-slate-200 bg-white ${
        padded ? 'px-4 py-4' : 'px-4 py-3'
      } shadow-sm dark:border-dark-border dark:bg-dark-surface`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold transition ${accentStyles[accent]}`}
            aria-label={open ? 'Collapse section' : 'Expand section'}
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>
      {(!collapsible || open) && children}
    </section>
  );
};
