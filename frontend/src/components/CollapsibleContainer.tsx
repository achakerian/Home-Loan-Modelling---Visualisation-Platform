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
    'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700',
  blue:
    'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-800/50 dark:text-brand-300 dark:hover:bg-brand-800',
  purple:
    'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-800/50 dark:text-purple-300 dark:hover:bg-purple-800',
};

export const CollapsibleContainer: React.FC<CollapsibleContainerProps> = ({
  title,
  children,
  collapsible = false,
  defaultOpen = false,
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
