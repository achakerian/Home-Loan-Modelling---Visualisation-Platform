import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

/**
 * Standard page wrapper component
 *
 * Provides consistent padding across all pages:
 * - px-6 (24px horizontal) - Standard page margins
 * - pt-4 (16px top) - Tight spacing below sticky header
 * - pb-32 (128px bottom) - Extra space above bottom navigation
 * - borderColor (optional) - Adds a full-height left border with the specified color
 *
 * @see DESIGN_SYSTEM.md - Spacing & Layout section
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  borderColor
}) => {
  return (
    <div className="relative">
      {borderColor && (
        <div
          className={`fixed left-0 top-0 h-full w-1 ${borderColor} opacity-40`}
          style={{ zIndex: 1 }}
        />
      )}
      <div className={`mx-auto max-w-md px-6 pb-32 pt-4 ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
};
