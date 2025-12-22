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
  slate: 'border-slate-200 text-slate-500 bg-slate-50 hover:border-slate-300 hover:text-slate-600 dark:border-slate-600 dark:text-slate-400',
  blue: 'border-brand-300 text-brand-500 bg-brand-50 hover:border-brand-400 hover:text-brand-600',
  purple: 'border-purple-200 text-purple-500 bg-purple-50 hover:border-purple-300 hover:text-purple-600',
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
      } shadow-sm dark:border-slate-700 dark:bg-brand-800/40`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-base font-semibold transition ${accentStyles[accent]}`}
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
