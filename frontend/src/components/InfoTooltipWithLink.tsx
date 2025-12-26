import React, { useState } from 'react';
import { InfoIcon } from './icons';

interface InfoTooltipWithLinkProps {
  content: string;
  linkText?: string;
  targetSection?: string; // Section ID on Information page to scroll to
  className?: string;
}

export const InfoTooltipWithLink: React.FC<InfoTooltipWithLinkProps> = ({
  content,
  linkText = 'Learn more in Information',
  targetSection,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = () => {
    if (targetSection) {
      // Open information page in new tab with hash for section
      window.open(`/information#${targetSection}`, '_blank');
    }
    setIsVisible(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (targetSection) {
      handleClick();
    } else {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleButtonClick}
        className={`flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-brand-500 dark:text-dark-muted dark:hover:text-brand-accent ${className}`}
        aria-label="Information"
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <p className="text-slate-700 dark:text-dark-text">{content}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-200 dark:border-t-dark-border"></div>
          </div>
        </div>
      )}
    </div>
  );
};
