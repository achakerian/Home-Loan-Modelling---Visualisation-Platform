import React from 'react';

export interface FeatureAccordionItem {
  title: string;
  content: string;
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

        return (
          <div
            key={item.title}
            className="rounded-2xl border-2 border-slate-300/60 bg-white p-4 shadow-md transition hover:border-brand-500/30 hover:shadow-lg dark:border-slate-700 dark:bg-brand-800"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                {item.badge && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    {item.badge}
                  </p>
                )}
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
              </div>
              <span
                className={`text-xl font-semibold text-brand-500 transition-transform ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                isOpen ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {item.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
