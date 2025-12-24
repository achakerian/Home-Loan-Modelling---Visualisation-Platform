import React from 'react';

export interface FeatureAccordionItem {
  title: string;
  content: React.ReactNode | string;
  badge?: string;
}

interface FeatureAccordionProps {
  items: FeatureAccordionItem[];
  initialOpen?: number | null;
}

export const FeatureAccordion: React.FC<FeatureAccordionProps> = ({
  items,
  initialOpen = 0,
}) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(initialOpen);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const isStringContent = typeof item.content === 'string';
        const paragraphs = isStringContent
          ? item.content?.split('\n\n') ?? []
          : [];
        const hasContent = isStringContent
          ? paragraphs.length > 0
          : Boolean(item.content);
        const stickyTop = 'var(--title-heading-offset, 88px)';

        return (
          <div
            key={item.title}
            className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-md transition hover:shadow-lg dark:border-dark-border dark:bg-dark-surface"
          >
            <div
              className={`${
                isOpen && hasContent
                  ? 'sticky z-20 -mx-4 px-4 py-2 bg-white dark:bg-dark-surfaceAlt'
                  : ''
              }`}
              style={
                isOpen && hasContent
                  ? { top: `calc(${stickyTop} + 4px)` }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  {item.badge && (
                    <p className="text-xs font-semibold text-slate-500 dark:text-dark-muted" aria-label="Section badge">
                      {item.badge}
                    </p>
                  )}
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {item.title}
                  </h2>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </div>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                isOpen ? 'mt-3 max-h-[200rem] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {isStringContent ? (
                paragraphs.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="mb-3 text-sm text-slate-700 last:mb-0 dark:text-dark-muted"
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <div className="py-1 text-slate-900 dark:text-dark-text">
                  {item.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
