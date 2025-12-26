import React, { useState } from 'react';
import { InfoIcon } from './icons';

interface TooltipProps {
  content: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className={`flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-brand-500 dark:text-dark-muted dark:hover:text-brand-accent ${className}`}
        aria-label="Information"
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-lg dark:border-dark-border dark:bg-dark-surface dark:text-dark-text">
          {content}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-200 dark:border-t-dark-border"></div>
          </div>
        </div>
      )}
    </div>
  );
};
